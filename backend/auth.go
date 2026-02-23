package main

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID int    `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func HashPassword(raw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	return string(b), err
}

func CheckPassword(hash, raw string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(raw))
}

func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func signAccessToken(userID int, email string) (string, time.Time, error) {
	ttlMin, _ := strconv.Atoi(os.Getenv("ACCESS_TOKEN_TTL_MIN"))
	exp := time.Now().Add(time.Duration(ttlMin) * time.Minute)

	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := t.SignedString([]byte(os.Getenv("JWT_ACCESS_SECRET")))
	return s, exp, err
}

func signRefreshToken(userID int, email string) (string, time.Time, error) {
	ttlDays, _ := strconv.Atoi(os.Getenv("REFRESH_TOKEN_TTL_DAYS"))
	exp := time.Now().Add(time.Duration(ttlDays) * 24 * time.Hour)

	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := t.SignedString([]byte(os.Getenv("JWT_REFRESH_SECRET")))
	return s, exp, err
}

func parseJWT(tokenStr, secret string, claims *Claims) (bool, error) {
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return false, err
	}
	return token.Valid, nil
}