const axios = require('axios');

// 直接在代码中定义企业微信配置（替代环境变量）
const CORP_ID = 'wwc911c66f428215b3';
const CORP_SECRET = 'KwSK-uSczRjDo_6NQ10wZHUGpGvVJ2g1sdQDw-1SU9k';
const AGENT_ID = '1000002';

// 获取access_token
async function getAccessToken() {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${CORP_SECRET}`;
    const response = await axios.get(url);
    return response.data.access_token;
}

// 获取jsapi_ticket
async function getJsApiTicket(accessToken) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${accessToken}`;
    const response = await axios.get(url);
    return response.data.ticket;
}

// 生成签名
function createSignature(jsapiTicket, nonceStr, timestamp, url) {
    const string1 = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    return require('crypto').createHash('sha1').update(string1).digest('hex');
}

exports.handler = async (event, context) => {
    try {
        // 获取URL参数
        const urlParams = new URLSearchParams(event.queryStringParameters);
        const url = urlParams.get('url');
        
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    errmsg: "缺少url参数", 
                    details: "请求中必须包含url参数" 
                })
            };
        }

        // 生成随机字符串和时间戳
        const nonceStr = Math.random().toString(36).substr(2, 15);
        const timestamp = Math.floor(Date.now() / 1000);
        
        // 获取access_token和jsapi_ticket
        const accessToken = await getAccessToken();
        
        // 检查access_token是否有效
        if (!accessToken) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    errmsg: "获取access_token失败",
                    details: "请检查CORP_ID和CORP_SECRET是否正确"
                })
            };
        }
        
        const jsapiTicket = await getJsApiTicket(accessToken);
        
        // 检查jsapi_ticket是否有效
        if (!jsapiTicket) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    errmsg: "获取jsapi_ticket失败",
                    details: "可能access_token无效或权限不足"
                })
            };
        }
        
        // 生成签名
        const signature = createSignature(jsapiTicket, nonceStr, timestamp, url);
        
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
        console.error("签名生成失败:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                errmsg: "签名生成失败",
                details: error.message
            })
        };
    }
};
