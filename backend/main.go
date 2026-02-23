package main

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type RegisterReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func main() {
	_ = godotenv.Load()

	if err := InitDB(); err != nil {
		panic(err)
	}
	defer DB.Close()

	r := gin.Default()

	// CORS dev (cukup untuk local)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", os.Getenv("FRONTEND_ORIGIN"))
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.POST("/auth/register", registerHandler)
	r.POST("/auth/login", loginHandler)
	r.POST("/auth/refresh", refreshHandler)
	r.POST("/auth/logout", logoutHandler)

	r.GET("/me", AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"userId": c.GetInt("userId"),
			"email":  c.GetString("email"),
		})
	})

	r.Run(":" + os.Getenv("PORT"))
}

func registerHandler(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash failed"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err = DB.Exec(ctx, `INSERT INTO users(email, password_hash) VALUES($1,$2)`, req.Email, hash)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already used or db error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true})
}

func loginHandler(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var id int
	var email string
	var hash string
	err := DB.QueryRow(ctx, `SELECT id, email, password_hash FROM users WHERE email=$1`, req.Email).
		Scan(&id, &email, &hash)
	if err != nil || CheckPassword(hash, req.Password) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	access, accessExp, err := signAccessToken(id, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}

	refresh, refreshExp, err := signRefreshToken(id, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}

	_, err = DB.Exec(ctx, `
		INSERT INTO refresh_tokens(user_id, token_hash, expires_at)
		VALUES($1,$2,$3)
	`, id, HashToken(refresh), refreshExp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	secure := os.Getenv("COOKIE_SECURE") == "true"
	domain := os.Getenv("COOKIE_DOMAIN")
	maxAge := int(time.Until(refreshExp).Seconds())

	c.SetCookie("refresh_token", refresh, maxAge, "/", domain, secure, true)

	c.JSON(http.StatusOK, gin.H{
		"accessToken": access,
		"expiresAt":   accessExp.UTC().Format(time.RFC3339),
	})
}

func refreshHandler(c *gin.Context) {
	refresh, err := c.Cookie("refresh_token")
	if err != nil || refresh == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	claims := &Claims{}
	ok, err := parseJWT(refresh, os.Getenv("JWT_REFRESH_SECRET"), claims)
	if err != nil || !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	var exists bool
	err = DB.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM refresh_tokens
			WHERE user_id=$1
			AND token_hash=$2
			AND revoked=FALSE
			AND expires_at > NOW()
		)
	`, claims.UserID, HashToken(refresh)).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token revoked/expired"})
		return
	}

	access, accessExp, err := signAccessToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": access,
		"expiresAt":   accessExp.UTC().Format(time.RFC3339),
	})
}

func logoutHandler(c *gin.Context) {
	refresh, _ := c.Cookie("refresh_token")
	if refresh != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		// revoke by token_hash
		_, _ = DB.Exec(ctx, `UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=$1`, HashToken(refresh))
	}

	secure := os.Getenv("COOKIE_SECURE") == "true"
	domain := os.Getenv("COOKIE_DOMAIN")
	c.SetCookie("refresh_token", "", -1, "/", domain, secure, true)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func _atoi(s string) int {
	v, _ := strconv.Atoi(s)
	return v
}