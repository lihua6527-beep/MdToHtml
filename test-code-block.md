### 错误信息标准化 {card-style="normal" icon="message"}
统一错误处理格式，避免暴露系统内部细节
```javascript
class NetworkError extends Error {
  constructor(type, message, originalError = null) {
    super(message);
    this.type = type; // NET_TIMEOUT, HTTP_502, DOMAIN_ERROR
  }
}
```