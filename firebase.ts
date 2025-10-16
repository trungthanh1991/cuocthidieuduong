// Sửa lỗi: Loại bỏ thẻ <script> không hợp lệ và cấu trúc lại tệp thành một module JavaScript tiêu chuẩn.
// Import các hàm cần thiết từ Firebase SDK.
import { initializeApp } from "https://esm.sh/firebase@10.12.2/app";
// Import tất cả các hàm database cần thiết tại đây để đảm bảo module được đăng ký đúng cách.
import { getDatabase, ref, onValue, set, update } from "https://esm.sh/firebase@10.12.2/database";

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

// Khởi tạo Realtime Database và export instance cùng các hàm tiện ích.
// Việc này tập trung tất cả logic Firebase vào một nơi, tránh lỗi khởi tạo.
const db = getDatabase(app);

export { db, ref, onValue, set, update };
