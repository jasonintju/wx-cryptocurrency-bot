/**
 * Wechaty - WeChat Bot SDK for Personal Account, Powered by TypeScript, Docker, and 💖
 *  - https://github.com/chatie/wechaty
 */
const { Wechaty } = require('wechaty')
const axios = require('axios');
const dateFormat = require('dateformat');

const ACCESS_KEY = 'xxx';
let USDCNY = 7;
const updateUSDCNY = async () => {
  // access_key 需要申请 https://currencylayer.com/，如果不使用实时汇率，可以设置默认值 USDCNY = 7
  await axios.get(`http://apilayer.net/api/live?access_key=${ACCESS_KEY}&currencies=CNY&source=USD&format=1`)
    .then(res => {
      const data = res.data;
      if (data.success) {
        USDCNY = data.quotes.USDCNY;
      }
    }).catch(err => console.log(err.error));
}
updateUSDCNY();
setInterval(() => {
  updateUSDCNY();
}, 8 * 60 * 60 * 1000);

const getResponseText = ({name, open, close, ts, currency = 'usdt', exchange = '火币'}) => {
  let price = `$${close}`;
  if (currency === 'cny' && USDCNY) {
    price = (close * USDCNY).toFixed(4);
    price = `¥${price}`;
  }

  ts = dateFormat(ts, 'yyyy-mm-dd HH:MM:ss');
  console.log(ts)
  let changeRatio = (close - open) / open;
  changeRatio = (changeRatio * 100).toFixed(2);
  changeRatio += '%';

  return `${name.toUpperCase()}的价格: ${price}\n24小时涨幅: ${changeRatio}\n时间: ${ts}\n-------------------------------\n数据来源: ${exchange}`
}

function onScan (qrcode) {
  require('qrcode-terminal').generate(qrcode)  // show qrcode on console

  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('')

  console.info(qrcodeImageUrl)
}

function onLogin (user) {
  console.info(`${user} login`)
}

function onLogout (user) {
  console.info(`${user} logout`)
}

async function onMessage (msg) {
  // if (msg.self()) {
  //     return
  // }
  const contact = msg.from()
  const room = msg.room()
  const content = msg.text().trim().replace(/\s+/g, ' ');

  const isCryptoCurrency = /^[a-zA-Z ]*$/.test(content);
  if (!isCryptoCurrency) return;
  

  const contentArray = content.split(' ');
  const cyptoCurrencyName = contentArray[0];
  let currency = 'usdt';
  let exchange = contentArray[2] && contentArray[2].toLowerCase();
  if (contentArray.length > 1) {
    currency = contentArray[1].toLowerCase();
    if (['fc', 'hb', 'ba'].indexOf(currency) !== -1) {
      exchange = currency;
      currency = 'usdt';
    } else if (currency === 'cny') {
      currency = currency;
    } else {
      currency = 'usdt';
    }
  }
  if (room) {
    const topic = await room.topic();
      console.log(`Room: ${topic} Contact: ${contact.name()} Content: ${content}`)
  } else {
      console.log(`Contact: ${contact.name()} Content: ${content}`)
  }

  const lowerCaseName = cyptoCurrencyName.toLowerCase();

  if (exchange) {
    if (exchange === 'fc') {
      axios.get(`https://api.fcoin.com/v2/market/ticker/${lowerCaseName}usdt`).then(res => {
        const data = res.data;
        if (data.status === 0) {
          const ts = Date.now();
          const open = data.data.ticker[6];
          const close = data.data.ticker[0];
          const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency, exchange: 'FCoin'})
          msg.say(responseContent)
        }
      }).catch(error => {
        // console.log(Object.keys(error))
      })
    } else if (exchange === 'hb') {
      axios.get(`https://api.huobi.pro/market/detail?symbol=${lowerCaseName}usdt`).then(res => {
        const data = res.data;
        if (data.status === 'ok') {
          const ts = data.ts;
          const open = data.tick.open;
          const close = data.tick.close;
          const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency, exchange: '火币'})
          msg.say(responseContent)
        }
      }).catch(error => {
        // console.log(Object.keys(error))
      })
    } else {
      axios.get(`ttps://api.binance.com/api/v1/ticker/24hr?symbol=${cyptoCurrencyName.toUpperCase()}USDT`).then(res => {
        const data = res.data;
        if (!data.code) {
          const ts = data.closeTime;
          const open = Number(data.openPrice);
          const close = Number(data.lastPrice);
          const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency, exchange: '币安'});
          msg.say(responseContent);
        }
      }).catch(error => {
        // console.log(Object.keys(error))
      })
    }
  } else {
    if (lowerCaseName === 'ft' || lowerCaseName === 'fi' || lowerCaseName === 'fmex' || lowerCaseName === 'fj') {
      let jp = '';
      if (lowerCaseName === 'fj') {
        jp = 'jp';
      } 
      axios.get(`https://api.fcoin${jp}.com/v2/market/ticker/${lowerCaseName}usdt`).then(res => {
        const data = res.data;
        if (data.status === 0) {
          const ts = Date.now();
          const open = data.data.ticker[6];
          const close = data.data.ticker[0];
          const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency, exchange: jp ? 'FCoinJP' : 'FCoin'})
          msg.say(responseContent)
        }
      }).catch(error => {
        // console.log(Object.keys(error))
      })
    } else {
      axios.get(`https://api.huobi.pro/market/detail?symbol=${lowerCaseName}usdt`).then(res => {
        const data = res.data;
        if (data.status === 'ok') {
          const ts = data.ts;
          const open = data.tick.open;
          const close = data.tick.close;
          const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency})
          msg.say(responseContent)
        } else {
          axios.get(`ttps://api.binance.com/api/v1/ticker/24hr?symbol=${cyptoCurrencyName.toUpperCase()}USDT`).then(res => {
            const data = res.data;
            if (!data.code) {
              const ts = data.closeTime;
              const open = Number(data.openPrice);
              const close = Number(data.lastPrice);
              const responseContent = getResponseText({name: cyptoCurrencyName, open, close, ts, currency, exchange: '币安'});
              msg.say(responseContent);
            }
          }).catch(error => {
            // console.log(Object.keys(error))
          })
        }
      }).catch(error => {
        // console.log(Object.keys(error))
      })
    }
  }
}

const bot = new Wechaty({ name: 'wechaty' })

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
  .then(() => console.info('Starter Bot Started.'))
  .catch(e => console.error(e))
