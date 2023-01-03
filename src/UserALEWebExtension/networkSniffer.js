(function () {
    var OrigWebSocket = window.WebSocket;
  
    var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
    var wsAddListener = OrigWebSocket.prototype.addEventListener;
    wsAddListener = wsAddListener.call.bind(wsAddListener);
    window.WebSocket = function WebSocket(url, protocols) {
      var ws;
      if (!(this instanceof WebSocket)) {
        // Called without 'new' (browsers will throw an error).
        ws = callWebSocket(this, arguments);
      } else if (arguments.length === 1) {
        ws = new OrigWebSocket(url);
      } else if (arguments.length >= 2) {
        ws = new OrigWebSocket(url, protocols);
      } else { // No arguments (browsers will throw an error)
        ws = new OrigWebSocket();
      }
  
      wsAddListener(ws, 'message', function (event) {
        document.dispatchEvent(new CustomEvent("WebSocketReceive", {
            detail: {
                data: event
            }
        }));
      });
      return ws;
    }.bind();
    window.WebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket.prototype.constructor = window.WebSocket;
  
    var wsSend = OrigWebSocket.prototype.send;
    wsSend = wsSend.apply.bind(wsSend);
    OrigWebSocket.prototype.send = function (data) {
        document.dispatchEvent(new CustomEvent("WebSocketSend", {
            detail: {
                data: data
            }
      }));
      return wsSend(this, arguments);
    };
  })();

const XHR = XMLHttpRequest.prototype;

const open = XHR.open;
const send = XHR.send;
const setRequestHeader = XHR.setRequestHeader;

XHR.open = function () {
    this._requestHeaders = {};

    return open.apply(this, arguments);
}

XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value;
    return setRequestHeader.apply(this, arguments);
}

XHR.send = function () {
        
    this.addEventListener('load', function () {
        const url = this.responseURL;

        const responseHeaders = this.getAllResponseHeaders();

        // Convert the header string into an array
        // of individual headers
        const arr = responseHeaders.trim().split(/[\r\n]+/);

        // Create a map of header names to values
        const headerMap = {};
        arr.forEach((line) => {
            const parts = line.split(': ');
            const header = parts.shift();
            const value = parts.join(': ');
            headerMap[header] = value;
        });

        try {
            if (this.responseType != 'blob') {
                let responseBody;
                if (this.responseType === '' || this.responseType === 'text') {
                    responseBody = JSON.parse(this.responseText);
                } else /* if (this.responseType === 'json') */ {
                    responseBody = this.response;
                }

                document.dispatchEvent(new CustomEvent("httpResponse", {
                    detail: {
                        url: url,
                        status: this.status,
                        responseHeaders: headerMap,
                        responseBody: responseBody
                    }
                  }));
            }
        } catch (err) {
            console.debug("Error reading or processing response.", err);
        }
    })

    return send.apply(this, arguments);
}