// Sửa lỗi: Loại bỏ thẻ <script> không hợp lệ và cấu trúc lại tệp thành một module JavaScript tiêu chuẩn.
// Import các hàm cần thiết từ Firebase SDK.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Cấu hình Firebase cho ứng dụng web của bạn
const firebaseConfig = {
    apiKey: "AIzaSyByIsqO2Kkpv9vGbSScAy3wSvTw53wuegk",
    authDomain: "cuoc-thi-dieu-duong.firebaseapp.com",
    databaseURL: "https://cuoc-thi-dieu-duong-default-rtdb.firebaseio.com",
    projectId: "cuoc-thi-dieu-duong",
    storageBucket: "cuoc-thi-dieu-duong.firebasestorage.app",
    messagingSenderId: "638987215243",
    appId: "1:638987215243:web:6cb1ed34cce0e805558f8e",
    measurementId: "G-CB445QDYYX"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Realtime Database và export instance để các tệp khác có thể sử dụng.
export const db = getDatabase(app);
