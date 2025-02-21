const API_URL = "http://localhost:5000/api";

// 📌 Функция переключения разделов
function showSection(section) {
    const sections = ["products", "cart", "login", "sign-in", "sign-up", "manage-products"];
    
    sections.forEach(sec => {
        const sectionElement = document.getElementById(`${sec}-section`);
        if (sectionElement) {
            sectionElement.style.display = "none";
        }
    });
    
    const activeSection = document.getElementById(`${section}-section`);
    if (activeSection) {
        activeSection.style.display = "block";
    } else {
        console.error(`❌ Секция с ID "${section}-section" не найдена!`);
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("logout-btn").style.display = "inline-block";

        if (role === "admin") {
            document.getElementById("manage-products-btn").style.display = "inline-block";
            document.getElementById("cart-btn").style.display = "none"; // Убираем Cart у админа
            loadAdminProducts();
        } else {
            document.getElementById("manage-products-btn").style.display = "none";
            document.getElementById("cart-btn").style.display = "inline-block"; // Показываем Cart для юзера
        }
    } else {
        document.getElementById("login-btn").style.display = "inline-block";
        document.getElementById("logout-btn").style.display = "none";
        document.getElementById("manage-products-btn").style.display = "none";
        document.getElementById("cart-btn").style.display = "inline-block";
    }
}

function toggleAuth(mode) {
    const signInForm = document.getElementById("sign-in-form");
    const signUpForm = document.getElementById("sign-up-form");
    const authTitle = document.getElementById("auth-title");

    if (mode === "sign-up") {
        signInForm.style.display = "none";
        signUpForm.style.display = "block";
        authTitle.innerText = "Sign Up";
    } else {
        signInForm.style.display = "block";
        signUpForm.style.display = "none";
        authTitle.innerText = "Sign In";
    }
}

// 📌 Функция логина (Sign In)
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user.role);

            document.getElementById("login-btn").style.display = "none";
            document.getElementById("logout-btn").style.display = "inline-block";

            if (data.user.role === "admin") {
                document.getElementById("manage-products-btn").style.display = "inline-block";
                document.getElementById("cart-btn").style.display = "none"; 
                loadAdminProducts();
            } else {
                document.getElementById("manage-products-btn").style.display = "none";
                document.getElementById("cart-btn").style.display = "inline-block"; 
                loadProducts();
            }
          
            checkAuthStatus();
            loadProducts();
            showSection("products");
        } else {
            alert("Login failed! Please check your email and password.");
        }
    } catch (error) {
        console.error("Error during login:", error);
    }
}

// 📌 Функция регистрации (Sign Up)
async function register() {
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (response.ok) {
            alert("Registration successful! Please log in.");
            toggleAuth();
        } else {
            alert("Registration failed! Please try again.");
        }
    } catch (error) {
        console.error("Error during registration:", error);
    }
}

// 📌 Функция добавления товара (админ)
// 📌 Функция добавления товара (админ)
document.getElementById("add-product-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("product-name").value;
    const category = document.getElementById("product-category").value;
    const price = document.getElementById("product-price").value;
    const stock = document.getElementById("product-stock").value || "0";
    const description = document.getElementById("product-description").value;
    const image = document.getElementById("product-image").value;
    const token = localStorage.getItem("token");

    console.log("📤 Sending data to server:", { name, category, price, stock, description, image });

    if (!token) {
        alert("You need to be logged in as an admin to add products.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, category, price, stock, description, image })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Product added successfully!");
            document.getElementById("add-product-form").reset();
            loadAdminProducts();
        } else {
            console.error("❌ Server response:", data);
            alert(`Failed to add product: ${data.message}`);
        }
    } catch (error) {
        console.error("❌ Error adding product:", error);
        alert("Server error: Could not add product.");
    }
});


// 📌 Функция загрузки товаров (для всех пользователей)
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const role = localStorage.getItem("role"); // Получаем роль пользователя

        let productHtml = products.map(product => `
            <div class="product">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Category: ${product.category}</p>
                <p>Price: $${product.price}</p>
                <p>Stock: ${product.stock}</p>
                <p>Description: ${product.description}</p>
                ${role && role !== "admin" ? `<button onclick="handlePurchase('${product._id}')">Add to Cart</button>` : ""}
            </div>
        `).join("");

        document.getElementById("products").innerHTML = productHtml;
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// 📌 Функция загрузки товаров для админов
async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        let productHtml = products.map(product => `
            <div class="product">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Category: ${product.category}</p>
                <p>Price: $${product.price}</p>
                <p>Stock: ${product.stock}</p>
                <p>Description: ${product.description}</p>
                <button onclick="editProduct('${product._id}')">Update</button> 
                <button onclick="deleteProduct('${product._id}')">Delete</button>
            </div>
        `).join("");

        document.getElementById("admin-products").innerHTML = productHtml;
    } catch (error) {
        console.error("Error loading admin products:", error);
    }
}

async function deleteProduct(productId) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("You need to be logged in as an admin to delete products.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Product deleted successfully!");
            loadAdminProducts(); // Обновляем список продуктов после удаления
        } else {
            alert("Failed to delete product!");
        }
    } catch (error) {
        console.error("Error deleting product:", error);
    }
}
// 📌 Функция заполнения формы редактирования товара
function editProduct(productId) {
    fetch(`${API_URL}/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById("product-id").value = product._id; 
            document.getElementById("product-name").value = product.name;
            document.getElementById("product-category").value = product.category;
            document.getElementById("product-price").value = product.price;
            document.getElementById("product-stock").value = product.stock;
            document.getElementById("product-description").value = product.description;
            document.getElementById("product-image").value = product.image;

            document.getElementById("add-product-btn").style.display = "none";
            document.getElementById("update-product-btn").style.display = "inline-block";
        })
        .catch(error => console.error("Error fetching product:", error));
}

// 📌 Функция обновления продукта
async function updateProduct() {
    const productId = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value;
    const category = document.getElementById("product-category").value;
    const price = document.getElementById("product-price").value;
    const stock = document.getElementById("product-stock").value || "0";
    const description = document.getElementById("product-description").value;
    const image = document.getElementById("product-image").value;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, category, price, stock, description, image })
        });

        if (response.ok) {
            alert("Product updated successfully!");
            document.getElementById("add-product-form").reset();
            document.getElementById("add-product-btn").style.display = "inline-block";
            document.getElementById("update-product-btn").style.display = "none";
            loadAdminProducts();
        } else {
            alert("Failed to update product!");
        }
    } catch (error) {
        console.error("Error updating product:", error);
    }
}


async function removeFromCart(productId) {
    console.log("🛒 Deleting product:", productId); // ✅ Логируем, какой ID передаём

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to modify your cart.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/remove/${productId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        console.log("🛠️ Server Response:", data);

        if (response.ok) {
            alert("✅ Product removed from cart!");
            loadCart(); // ✅ Обновляем корзину после удаления
        } else {
            alert(`❌ Failed to remove product: ${data.message}`);
        }
    } catch (error) {
        console.error("❌ Error removing product:", error);
    }
}


// 📌 Функция выхода из аккаунта
function logout() {
    
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.clear();
    checkAuthStatus();
    
    document.getElementById("login-btn").style.display = "inline-block";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("manage-products-btn").style.display = "none";
    document.getElementById("cart-btn").style.display = "inline-block";

    showSection("login");
    loadProducts(); // 🔥 Перезагружаем товары, чтобы скрыть кнопку "Add to Cart" после выхода
}

function handlePurchase(productId) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please log in to add products to your cart!");
        showSection("login");
        return;
    }

    addToCart(productId);
}

// 📌 Функция добавления в корзину
async function addToCart(productId) {
    const token = localStorage.getItem("token");
    

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Product added to cart!");
            loadCart(); // Обновляем корзину
        } else {
            alert("Failed to add to cart: " + data.message);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

// 📌 Функция загрузки корзины
// 📌 Функция загрузки корзины (исправленный вариант)
// 📌 Функция загрузки корзины с изменяемым количеством
async function loadCart() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const cart = await response.json();

        if (!cart.products || cart.products.length === 0) {
            document.getElementById("cart").innerHTML = "<p>Cart is empty</p>";
            return;
        }

        let cartHtml = cart.products.map(item => {
            if (!item.productId || !item.productId.name) {
                console.error("Error: productId is missing in cart item:", item);
                return "";
            }

            return `
                <div class="cart-item">
                    <h3>${item.productId.name}</h3>
                    <p>Price: $${item.productId.price}</p>
                    <p>Stock: ${item.productId.stock}</p>
                    <label for="quantity-${item.productId._id}">Quantity:</label>
                    <input type="number" id="quantity-${item.productId._id}" value="${item.quantity}" min="1" max="${item.productId.stock}" 
                           onchange="updateCartQuantity('${item.productId._id}', this.value)">
                    
                </div>
            `;
        }).join("");

        cartHtml += `<button onclick="buyNow()">Buy Now</button>`;

        document.getElementById("cart").innerHTML = cartHtml;
    } catch (error) {
        console.error("Error loading cart:", error);
    }
}


// 📌 Функция обновления количества товара в корзине
async function updateCartQuantity(productId, newQuantity) {
    const token = localStorage.getItem("token");
    if (!token) return;

    console.log("🛠️ Updating cart:", { productId, newQuantity });

    try {
        const response = await fetch(`${API_URL}/cart/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: newQuantity })
        });

        const data = await response.json();
        console.log("🔄 Server response:", data);

        if (response.ok) {
            console.log("✅ Cart updated successfully");
            loadCart();
        } else {
            alert(`✅ Cart updated successfully ${data.message}`);
        }
    } catch (error) {
        console.error("❌ Error updating cart:", error);
    }
}



// 📌 Функция покупки товаров из корзины
async function buyNow() {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in to complete the purchase.");

    try {
        const response = await fetch(`${API_URL}/orders/create`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            alert("Purchase successful!");
            loadCart(); // Очищаем корзину
            loadProducts(); // Обновляем товары
        } else {
            alert(`Purchase failed: ${data.message}`);
        }
    } catch (error) {
        console.error("Error during purchase:", error);
    }
}





// 📌 Функция удаления товара из корзины

// 📌 Загружаем товары при запуске
window.onload = () => {
    checkAuthStatus();
    loadProducts();
    showSection("products");
};
