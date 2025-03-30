const fs = require('fs');
const path = require('path')
module.exports = {
	// 统一 - 支付回调地址,格式为 "服务空间ID":"URL化地址"
	"notifyUrl": {
		// 线上环境服务空间-支付回调地址（如果只有一个服务空间，则只需要配置线上环境服务空间即可）
		"mp-ce5205c8-70ee-4830-b92a-b3199ca7d6f3": "https://fc-mp-ce5205c8-70ee-4830-b92a-b3199ca7d6f3.next.bspapp.com/uni-pay-co",
	},
	"notifyKey":"NY9SEMYRGBUP87854SWRPNKN1D5K6XBVOYX1OU8C7KVPTJMF316KK9GZNYT02369", // 跨云函数通信时的加密密钥，建议手动改下，不要使用默认的密钥，长度保持在64位以上即可
	// 微信支付相关
	"wxpay": {
		"enable": true, // 是否启用微信支付
		// 微信 - 小程序支付
		"mp": {
			"appId": "wxea3e9319ea83bb6d", // 小程序的appid
			"secret": "41068c15ab3c0709fa2335f2ab18c8df", // 小程序的secret
			"mchId": "1712376707", // 商户id
			"key": "92643942698926439264394269892643", // v2的api key
			"pfx": fs.readFileSync(__dirname + '/wxpay/apiclient_cert.p12'), // v2需要用到的证书
			"v3Key": "Yw9896yWYw9896yWYw9896yWYw9896yW", // v3的api key
			"appCertPath": path.join(__dirname, 'wxpay/apiclient_cert.pem'), // v3需要用到的证书
			"appPrivateKeyPath": path.join(__dirname, 'wxpay/apiclient_key.pem'), // v3需要用到的证书
			"wxpayPublicKeyPath": path.join(__dirname, 'wxpay/pub_key.pem'), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数）
			"version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本
		},
		// 微信 - 扫码支付
		"native": {
			"appId": "wxea3e9319ea83bb6d", // 可以是小程序或公众号或app开放平台下的应用的任意一个appid
			"secret": "41068c15ab3c0709fa2335f2ab18c8df", // secret
			"mchId": "1712376707", // 商户id
			"key": "92643942698926439264394269892643", // v2的api key
			"pfx": fs.readFileSync(__dirname + '/wxpay/apiclient_cert.p12'), // v2需要用到的证书
			"v3Key": "Yw9896yWYw9896yWYw9896yWYw9896yW", // v3的api key
			"appCertPath": path.join(__dirname, 'wxpay/apiclient_cert.pem'), // v3需要用到的证书
			"appPrivateKeyPath": path.join(__dirname, 'wxpay/apiclient_key.pem'), // v3需要用到的证书
			"wxpayPublicKeyPath": path.join(__dirname, 'wxpay/pub_key.pem'), // v3需要用到的证书 - 微信支付公钥证书（仅限开启了微信支付公钥的商户，若已开通微信支付平台证书的商户可无视此参数）
			"version": 3, // 启用支付的版本 2代表v2版本 3 代表v3版本
		},
	},
}