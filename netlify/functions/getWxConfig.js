const axios = require('axios');

// 从环境变量获取配置
const CORP_ID = process.env.WX_CORP_ID;
const CORP_SECRET = process.env.WX_CORP_SECRET;
const AGENT_ID = process.env.WX_AGENT_ID;

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
        // 验证环境变量是否设置
        if (!CORP_ID || !CORP_SECRET || !AGENT_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    errmsg: "环境变量未正确配置",
                    details: "请确保设置了WX_CORP_ID, WX_CORP_SECRET, WX_AGENT_ID"
                })
            };
        }

        // 获取URL参数
        const urlParams = new URLSearchParams(event.queryStringParameters);
        const url = urlParams.get('url');
        
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ errmsg: "缺少url参数" })
            };
        }

        // 生成随机字符串和时间戳
        const nonceStr = Math.random().toString(36).substr(2, 15);
        const timestamp = Math.floor(Date.now() / 1000);
        
        // 获取access_token和jsapi_ticket
        const accessToken = await getAccessToken();
        const jsapiTicket = await getJsApiTicket(accessToken);
        
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
