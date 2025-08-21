const axios = require('axios');

// 直接在代码中定义企业微信配置
const CORP_ID = 'wwc911c66f428215b3';
const CORP_SECRET = 'KwSK-uSczRjDo_6NQ10wZHUGpGvVJ2g1sdQDw-1SU9k';
const AGENT_ID = '1000002';

// 获取access_token（增强错误处理）
async function getAccessToken() {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${CORP_SECRET}`;
    try {
        const response = await axios.get(url);
        
        // 检查企业微信API是否返回错误
        if (response.data && response.data.errcode && response.data.errcode !== 0) {
            throw new Error(`企业微信API错误 [gettoken]: ${response.data.errcode} - ${response.data.errmsg}`);
        }
        
        return response.data.access_token;
    } catch (error) {
        if (error.response) {
            throw new Error(`企业微信API请求失败 [gettoken]: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            throw new Error(`网络请求错误 [gettoken]: ${error.message}`);
        }
    }
}

// 获取jsapi_ticket（增强错误处理）
async function getJsApiTicket(accessToken) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${accessToken}`;
    try {
        const response = await axios.get(url);
        
        // 检查企业微信API是否返回错误
        if (response.data && response.data.errcode && response.data.errcode !== 0) {
            throw new Error(`企业微信API错误 [get_jsapi_ticket]: ${response.data.errcode} - ${response.data.errmsg}`);
        }
        
        return response.data.ticket;
    } catch (error) {
        if (error.response) {
            throw new Error(`企业微信API请求失败 [get_jsapi_ticket]: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            throw new Error(`网络请求错误 [get_jsapi_ticket]: ${error.message}`);
        }
    }
}

// 生成签名
function createSignature(jsapiTicket, nonceStr, timestamp, url) {
    const string1 = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    return require('crypto').createHash('sha1').update(string1).digest('hex');
}

exports.handler = async (event, context) => {
    try {
        console.log("Function调用开始");
        console.log("事件参数:", JSON.stringify(event));
        
        // 获取URL参数
        const urlParams = new URLSearchParams(event.queryStringParameters);
        const url = urlParams.get('url');
        
        if (!url) {
            console.error("缺少url参数");
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    errmsg: "缺少url参数", 
                    details: "请求中必须包含url参数" 
                })
            };
        }
        
        console.log("请求的URL:", url);
        
        // 生成随机字符串和时间戳
        const nonceStr = Math.random().toString(36).substr(2, 15);
        const timestamp = Math.floor(Date.now() / 1000);
        
        console.log("尝试获取access_token...");
        // 获取access_token和jsapi_ticket
        const accessToken = await getAccessToken();
        console.log("获取到access_token:", accessToken);
        
        console.log("尝试获取jsapi_ticket...");
        const jsapiTicket = await getJsApiTicket(accessToken);
        console.log("获取到jsapi_ticket:", jsapiTicket);
        
        // 生成签名
        const signature = createSignature(jsapiTicket, nonceStr, timestamp, url);
        console.log("生成的签名:", signature);
        
        // 返回配置
        return {
            statusCode: 200,
            body: JSON.stringify({
                corpId: CORP_ID,
                agentId: AGENT_ID,
                nonceStr: nonceStr,
                timestamp: timestamp,
                signature: signature
            })
        };
        
    } catch (error) {
        console.error("服务器端错误详情:", {
            message: error.message,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                errmsg: "服务器内部错误",
                details: error.message,
                // 仅在开发环境显示堆栈信息
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
