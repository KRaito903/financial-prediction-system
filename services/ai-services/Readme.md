## Server chạy ở port 4006

## Có api (query + mutation) chính

- predict (query): trả về time dự đoán (7, 14, 28) với timxer (tính theo ngày), tất các các khoảng thì sài timeGPT (theo ngay và giừo điều được) => này cho khách hàng thường.

- training (mutation): tạo model timexer => có thể cho khách hàng vip hơn chẳng hạn


## cách chạy
# ở local
- pip install -r requirements.txt => lưu ý thằng torch nha 
- chạy lệnh: strawberry server --port 4006 graphql_api.schema

# Docker 

- cd vào folder service và chạy lệnh: docker-compose up ai-prediction-service  (do chưa chèn trực tiếp vào, có thể bị năng máy nên chưa dám test chèn ở file tổng).



