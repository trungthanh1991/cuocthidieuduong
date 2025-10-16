// Cấu trúc: { q: "Câu hỏi", o: ["Lựa chọn A", "Lựa chọn B", ...], a: 0 } (a là chỉ số của đáp án đúng)
window.questionBank = [
  {
    q: "Rửa tay thường quy theo quy trình của Bộ Y Tế gồm bao nhiêu bước?",
    o: ["4 bước", "5 bước", "6 bước", "7 bước"],
    a: 2 // Đáp án đúng là "6 bước"
  },
  {
    q: "Chỉ số nào sau đây KHÔNG thuộc về dấu hiệu sinh tồn?",
    o: ["Mạch", "Nhiệt độ", "Đường huyết mao mạch", "Huyết áp"],
    a: 2 // Đáp án đúng là "Đường huyết mao mạch"
  },
  {
    q: "Tư thế Fowler là tư thế nào?",
    o: ["Nằm ngửa", "Nằm sấp", "Nằm nghiêng", "Nửa nằm nửa ngồi"],
    a: 3 // Đáp án đúng là "Nửa nằm nửa ngồi"
  },
   {
    q: "Kỹ thuật tiêm tĩnh mạch thường được thực hiện ở góc bao nhiêu độ?",
    o: ["90 độ", "45 độ", "15-30 độ", "5-10 độ"],
    a: 2
  },
  {
    q: "Mục đích chính của việc ghi chép hồ sơ bệnh án là gì?",
    o: ["Để làm thủ tục thanh toán viện phí", "Để theo dõi diễn biến bệnh và kết quả điều trị", "Để lưu trữ thông tin cá nhân của bệnh nhân", "Để làm bằng chứng pháp lý khi có kiện tụng"],
    a: 1
  },
  // Thêm các câu hỏi ngẫu nhiên để đủ số lượng
  ...Array.from({ length: 95 }, (_, i) => ({
    q: `Đây là nội dung câu hỏi trắc nghiệm mẫu số ${i + 6}?`,
    o: [
      `Phương án trả lời A cho câu ${i + 6}`,
      `Phương án trả lời B cho câu ${i + 6}`,
      `Phương án trả lời C cho câu ${i + 6}`,
      `Phương án trả lời D cho câu ${i + 6}`
    ],
    a: Math.floor(Math.random() * 4), // Đáp án đúng ngẫu nhiên
  })),
];
