package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB
var jwtKey = []byte("your-secret-key-change-in-production")

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	Role     string `json:"role"`
}

type Product struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	ImageURL    string    `json:"image_url"`
	IsPromo     bool      `json:"is_promo"`
	SellerID    int       `json:"seller_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type Order struct {
	ID         int       `json:"id"`
	BuyerID    int       `json:"buyer_id"`
	ProductID  int       `json:"product_id"`
	Quantity   int       `json:"quantity"`
	TotalPrice float64   `json:"total_price"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func main() {
	initDB()
	defer db.Close()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.POST("/register", register)
		api.POST("/login", login)

		auth := api.Group("")
		auth.Use(authMiddleware())
		{
			auth.GET("/products", getProducts)
			auth.GET("/products/:id", getProduct)
			auth.POST("/products", createProduct)
			auth.POST("/orders", createOrder)
			auth.GET("/orders", getOrders)
			auth.GET("/me", getCurrentUser)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Server starting on port %s...\n", port)
	r.Run(":" + port)
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./secondhand.db")
	if err != nil {
		log.Fatal(err)
	}

	createTables()
	insertSampleData()
}

func createTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('buyer', 'seller'))
		)`,
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			price REAL NOT NULL,
			stock INTEGER NOT NULL DEFAULT 0,
			image_url TEXT,
			is_promo INTEGER NOT NULL DEFAULT 0,
			seller_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (seller_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			buyer_id INTEGER NOT NULL,
			product_id INTEGER NOT NULL,
			quantity INTEGER NOT NULL,
			total_price REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'completed',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (buyer_id) REFERENCES users(id),
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`,
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Fatal(err)
		}
	}
}

func insertSampleData() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	
	_, err := db.Exec("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", "seller1", string(hashedPassword), "seller")
	if err != nil {
		log.Println(err)
	}
	_, err = db.Exec("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", "buyer1", string(hashedPassword), "buyer")
	if err != nil {
		log.Println(err)
	}

	products := []Product{
		{Name: "iPhone 13 Pro", Description: "95新，无划痕，电池健康92%", Price: 4599, Stock: 5, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2013%20Pro%20smartphone%20on%20white%20background&image_size=square", IsPromo: true, SellerID: 1},
		{Name: "MacBook Air M2", Description: "几乎全新，使用不到3个月", Price: 7999, Stock: 2, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Air%20laptop%20silver%20color&image_size=square", IsPromo: false, SellerID: 1},
		{Name: "Sony WH-1000XM4", Description: "降噪耳机，音质极佳", Price: 1299, Stock: 0, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20headphones%20black%20color%20wireless&image_size=square", IsPromo: true, SellerID: 1},
		{Name: "iPad Pro 11寸", Description: "2022款，带Apple Pencil", Price: 5299, Stock: 3, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPad%20Pro%20tablet%20with%20pencil&image_size=square", IsPromo: false, SellerID: 1},
		{Name: "Nintendo Switch OLED", Description: "港版，带游戏卡带", Price: 1999, Stock: 8, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nintendo%20Switch%20gaming%20console&image_size=square", IsPromo: true, SellerID: 1},
		{Name: "AirPods Pro 2", Description: "正品，包装齐全", Price: 1499, Stock: 10, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AirPods%20Pro%20wireless%20earbuds&image_size=square", IsPromo: false, SellerID: 1},
		{Name: "Dell 27寸显示器", Description: "4K分辨率，IPS面板", Price: 1899, Stock: 4, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dell%20computer%20monitor%2027%20inch&image_size=square", IsPromo: false, SellerID: 1},
		{Name: "机械键盘 Filco", Description: "茶轴，手感一流", Price: 899, Stock: 6, ImageURL: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mechanical%20keyboard%20gaming%20RGB&image_size=square", IsPromo: true, SellerID: 1},
	}

	for _, p := range products {
		_, err := db.Exec(`INSERT INTO products (name, description, price, stock, image_url, is_promo, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			p.Name, p.Description, p.Price, p.Stock, p.ImageURL, p.IsPromo, p.SellerID)
		if err != nil {
			log.Println(err)
		}
	}
}

func register(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
		return
	}

	result, err := db.Exec("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
		user.Username, string(hashedPassword), user.Role)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "username": user.Username, "role": user.Role})
}

func login(c *gin.Context) {
	var loginUser User
	if err := c.ShouldBindJSON(&loginUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	var hashedPassword string
	err := db.QueryRow("SELECT id, username, password, role FROM users WHERE username = ?", loginUser.Username).
		Scan(&user.ID, &user.Username, &hashedPassword, &user.Role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(loginUser.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  gin.H{"id": user.ID, "username": user.Username, "role": user.Role},
	})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供认证token"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func getCurrentUser(c *gin.Context) {
	userID := c.GetInt("user_id")
	role := c.GetString("role")

	var username string
	err := db.QueryRow("SELECT username FROM users WHERE id = ?", userID).Scan(&username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": userID, "username": username, "role": role})
}

func getProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "8"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort", "created_at")
	sortOrder := c.DefaultQuery("order", "desc")

	offset := (page - 1) * limit

	query := `SELECT id, name, description, price, stock, image_url, is_promo, seller_id, created_at FROM products WHERE 1=1`
	args := []interface{}{}

	if search != "" {
		query += " AND (name LIKE ? OR description LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	validSortColumns := map[string]bool{"price": true, "created_at": true, "stock": true}
	if !validSortColumns[sortBy] {
		sortBy = "created_at"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	query += fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortBy, sortOrder)
	args = append(args, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		var createdAtStr string
		err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.ImageURL, &p.IsPromo, &p.SellerID, &createdAtStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		products = append(products, p)
	}

	countQuery := "SELECT COUNT(*) FROM products WHERE 1=1"
	countArgs := []interface{}{}
	if search != "" {
		countQuery += " AND (name LIKE ? OR description LIKE ?)"
		countArgs = append(countArgs, "%"+search+"%", "%"+search+"%")
	}

	var total int
	db.QueryRow(countQuery, countArgs...).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    (total + limit - 1) / limit,
	})
}

func getProduct(c *gin.Context) {
	id := c.Param("id")
	var p Product
	var createdAtStr string
	err := db.QueryRow(`SELECT id, name, description, price, stock, image_url, is_promo, seller_id, created_at FROM products WHERE id = ?`, id).
		Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.ImageURL, &p.IsPromo, &p.SellerID, &createdAtStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "商品不存在"})
		return
	}
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	c.JSON(http.StatusOK, p)
}

func createProduct(c *gin.Context) {
	role := c.GetString("role")
	if role != "seller" {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有卖家可以发布商品"})
		return
	}

	var product Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sellerID := c.GetInt("user_id")
	result, err := db.Exec(`INSERT INTO products (name, description, price, stock, image_url, is_promo, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		product.Name, product.Description, product.Price, product.Stock, product.ImageURL, product.IsPromo, sellerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	product.ID = int(id)
	product.SellerID = sellerID
	c.JSON(http.StatusCreated, product)
}

func createOrder(c *gin.Context) {
	var orderRequest struct {
		ProductID int `json:"product_id"`
		Quantity  int `json:"quantity"`
	}

	if err := c.ShouldBindJSON(&orderRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	var stock int
	var price float64
	err = tx.QueryRow("SELECT stock, price FROM products WHERE id = ?", orderRequest.ProductID).Scan(&stock, &price)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "商品不存在"})
		return
	}

	if stock < orderRequest.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "库存不足"})
		return
	}

	_, err = tx.Exec("UPDATE products SET stock = stock - ? WHERE id = ?", orderRequest.Quantity, orderRequest.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	buyerID := c.GetInt("user_id")
	totalPrice := price * float64(orderRequest.Quantity)
	result, err := tx.Exec(`INSERT INTO orders (buyer_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)`,
		buyerID, orderRequest.ProductID, orderRequest.Quantity, totalPrice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	orderID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{
		"id":          orderID,
		"total_price": totalPrice,
		"message":     "下单成功",
	})
}

func getOrders(c *gin.Context) {
	userID := c.GetInt("user_id")
	role := c.GetString("role")

	var query string
	var args []interface{}

	if role == "seller" {
		query = `SELECT o.id, o.buyer_id, o.product_id, o.quantity, o.total_price, o.status, o.created_at 
		         FROM orders o JOIN products p ON o.product_id = p.id 
		         WHERE p.seller_id = ? ORDER BY o.created_at DESC`
		args = append(args, userID)
	} else {
		query = `SELECT id, buyer_id, product_id, quantity, total_price, status, created_at 
		         FROM orders WHERE buyer_id = ? ORDER BY created_at DESC`
		args = append(args, userID)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var createdAtStr string
		err := rows.Scan(&o.ID, &o.BuyerID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &createdAtStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		o.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		orders = append(orders, o)
	}

	c.JSON(http.StatusOK, orders)
}
