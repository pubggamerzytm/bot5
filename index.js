const Telegraf = require('telegraf')
const mongo = require('mongodb').MongoClient
const data = require('./data')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const { leave } = Stage
const stage = new Stage()
var Client = require('coinbase').Client;
var client = new Client({
   apiKey: '',
   apiSecret: '',
strictSSL: false
});
 
const bot = new Telegraf(data.token)
let db

/*const balance = new Scene('balance')
stage.register(balance)
const bonus = new Scene('bonus')
stage.register(bonus)
const referral = new Scene('referral')
stage.register(referral)
const withdraw = new Scene('withdraw')
stage.register(withdraw)*/

mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db(data.botname)
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('🤖 is listening to your commands')
  bot.startPolling()
})

})


//const stage = new Stage()
bot.use(session())
bot.use(stage.middleware())

const getNumber = new Scene('getNumber')
stage.register(getNumber)


const onWithdraw = new Scene('onWithdraw')
stage.register(onWithdraw)



bot.hears(/^\/start (.+[1-9]$)/, async (ctx) => { 
try { 
   let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
   
  let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()
  // let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()
    if (dbData.length === 0 && ctx.from.id != +ctx.match[1]) {
    db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, paid: false})
      db.collection('balance').insertOne({userId: ctx.from.id, balance:0})
  db.collection('pendUsers').insertOne({userId: ctx.from.id, inviter: +ctx.match[1] })}
 
   if(mustJoin.length===0){
      mustjoin(ctx) 
     return
   }
  ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true }})
} catch (err) {
    sendError(err, ctx)
  }
})

bot.start(async (ctx) => {
  try {
  let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
  let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()
    if (dbData.length === 0) {
      db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, balance: 0})
      db.collection('balance').insertOne({userId: ctx.from.id, balance:0})
    db.collection('pendUsers').insertOne({userId: ctx.from.id})}
        
   if(mustJoin.length===0){
      mustjoin(ctx) 
     return
   }
   
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true }})
} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('💰 Balance', async (ctx) => {
try {
let notPaid = await db.collection('allUsers').find({inviter: ctx.from.id, paid: false}).toArray() // only not paid invited users
    let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
    let thisUsersData = await db.collection('balance').find({userId: ctx.from.id}).toArray()
    
let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()

   /* if (thisUsersData[0].virgin) {
      sum = notPaid.length * 0.00001000
    } else {
      sum = notPaid.length * 0.00001000
    }*/
if(mustJoin.length===0){
      mustjoin(ctx) 
     return
   }
let sum = thisUsersData[0].balance
    ctx.reply('💰 *Your Account Balance:*   \n\n_'+sum.toFixed(8)+' LTC_',{parse_mode:'markdown'})
} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('🎁 Bonus', async (ctx) => {
try {

let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()
let dData = await db.collection('bonusforUsers').find({userId: ctx.from.id}).toArray()
if(mustJoin.length===0){
      mustjoin(ctx) 
     return
   }

var duration_in_hours;

var tin = new Date().toISOString();

if(dData.length===0){
db.collection('bonusforUsers').insertOne({userId: ctx.from.id, bonus: new Date()})
duration_in_hours = 99;
}else{
 duration_in_hours = ((new Date()) - new Date(dData[0].bonus))/1000/60/60;
}



if(duration_in_hours>=24){

let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()

var adm = bal[0].balance*1
var addo = adm+0.000005

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})

db.collection('bonusforUsers').updateOne({userId: ctx.from.id}, {$set: {bonus: tin}}, {upsert: true})

ctx.replyWithMarkdown('*✅ Today you received 0.000005 LTC*\n\n_Come back tomorrow and try again.This Is free Bonus 🎁_').catch((err) => sendError(err, ctx))
}else{
var duration_in_hour= Math.abs(duration_in_hours - 24);
var hours= Math.floor(duration_in_hour);
var minutes = Math.floor((duration_in_hour - hours)*60);
var seconds = Math.floor(((duration_in_hour - hours)*60-minutes)*60);
ctx.replyWithMarkdown('*📵 Sorry but you have received your bonus today.*\n\n✅ _You Have receive your bonus in the past:\n⏳ '+hours+' hours :'+minutes+' minutes :'+seconds+' seconds_').catch((err) => sendError(err, ctx))
}
}  catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('👫 Referral', async (ctx) => {
try {
let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
ctx.reply(
'*👥 You Invited: *'+ allRefs.length +'  referrals\n*🔗 Your referral link:* https://t.me/'+data.botname+'?start=' + ctx.from.id +'\n\n💰 *Per Referral 0.00001 LTC* - _Share Your referral link to your Friends & earn unlimited LTC_\n\n⚠️ *Note*\n_Fake, empty or spam users are deleted after checking._',  {parse_mode: 'markdown'})
} catch (err) {
    sendError(err, ctx)
  }
})



bot.hears('📊 Stat', async (ctx) => {
try {
let dbData = await db.collection('allUsers').find({stat:"stat"}).toArray()
let dData = await db.collection('allUsers').find({}).toArray()

if(dbData.length===0){
db.collection('allUsers').insertOne({stat:"stat", value:0})
ctx.replyWithMarkdown(
'😎 *Total members:* `'+dData.length+'`\n😇 *Total Payout:* `0.00000000 LTC`'
)
return
}else{
let val = dbData[0].value*1
ctx.replyWithMarkdown(
'😎 *Total members:* '+dData.length+'\n😇 *Total Payout:* '+val.toFixed(8)+' LTC'
)
}}
  catch (err) {
    sendError(err, ctx)
  }
})



bot.hears('🔙 back', async (ctx) => {
try {
let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()

 ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true }})
   
} catch (err) {
    sendError(err, ctx)
  }
})


bot.hears('🏧 Coinbase Email', async (ctx) => {
try {
let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
    ctx.reply('💡 *Your coinbase email is:* `'+ dbData[0].coinmail +'`',
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Email', 'iamsetemail')]
      ])) .markdown()
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.reply('💡 *Your coinbase email is:* _not set_', 
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Email', 'iamsetemail')]
      ])) .markdown()
      ) 
           .catch((err) => sendError(err, ctx))
    }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.hears('🟢 Joined', async (ctx) => {
try {
let dbData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()

let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()



let tgData = await bot.telegram.getChatMember(data.channel, ctx.from.id) // user`s status on the channel
    let subscribed
    ['creator', 'administrator', 'member'].includes(tgData.status) ? subscribed = true : subscribed = false
    let tData = await bot.telegram.getChatMember(data.channel2, ctx.from.id) // user`s status on the channel
    let subscrib
    ['creator', 'administrator', 'member'].includes(tData.status) ? subscrib = true : subscrib = false
    if(!subscribed && !subscrib) {
    mustjoin(ctx) 
   }else if(subscribed && !subscrib) {
   mustjoin(ctx) 
   }else if(!subscribed && subscrib){
mustjoin(ctx) 
      }else{
   

 if(('inviter' in dbData[0]) && !('referred' in dData[0])){
 let bal = await db.collection('balance').find({userId: dbData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = 0.00001*1
 var see = cal+sen

   bot.telegram.sendMessage(dbData[0].inviter, '➕ *New Referral on your link* you received 0.00001 LTC', {parse_mode:'markdown'})
   
 db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: dbData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: dbData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true } })
  //db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})
 
 
    }else{
db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true } })}
}}
  catch (err) {
    sendError(err, ctx)
  }
})
    
    
    
    
bot.action('iamsetemail', async (ctx) => {
  try {
    ctx.editMessageText(
      '✏️ *Send now your Coinbase Email* to use it in future withdrawals!', {parse_mode: 'markdown'})
        .catch((err) => sendError(err, ctx))
        ctx.scene.enter('getNumber')
  } catch (err) {
    sendError(err, ctx)
  }
})

getNumber.hears(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, async (ctx) => { 
ctx.replyWithMarkdown(
'🖊* Done:* Your new coinbase email is\n`'+ctx.message.text+'`',
{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true } }
  )  
   .catch((err) => sendError(err, ctx))

  db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
  .catch((err) => sendError(err, ctx))
  ctx.scene.leave('getNumber')
})


bot.hears('🤑 Withdraw', async (ctx) => {
try {
let notPaid = await db.collection('allUsers').find({inviter: ctx.from.id, paid: false}).toArray() // only not paid invited users
let thisUsersData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()
let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()

if(mustJoin.length===0){
      mustjoin(ctx) 
     return
   }
 
let sum = bal[0].balance*1
       if (!('coinmail' in thisUsersData[0])) {
      return ctx.reply('💡 *Your coinbase email is:* `not set`', 
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Email', 'iamsetemail')]
      ])) .markdown()
      ) 
           .catch((err) => sendError(err, ctx))
       }
if (sum >= 0.000005){
ctx.scene.enter('onWithdraw')
ctx.replyWithMarkdown(
'⏳* Send me the amount you want to withdraw*\n*Min* -> `0.000005` LTC\n*Max* -> `'+sum.toFixed(8)+'` LTC\n\n🔌 *Coinbase Email* -> `'+thisUsersData[0].coinmail+'`' ,
{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true } }
)
}else{
ctx.reply('❌ *You have to own at least 0.000005 LTC in your balance to withdraw!*',{parse_mode:"markdown"})
}
} catch (err) {
    sendError(err, ctx)
  }
})

onWithdraw.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('onWithdraw')
})

onWithdraw.hears( /^[0-9](\.[0-9]+)?$/, async (ctx) => {
try {
let notPaid = await db.collection('allUsers').find({inviter: ctx.from.id, paid: false}).toArray() // only not paid invited users
let thisUsersData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

 let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()
 
let dbData = await db.collection('allUsers').find({stat:"stat"}).toArray()

let caa = dbData[0].value*1

let sum = bal[0].balance*1

   if (ctx.message.text>sum){
    ctx.reply('⛔️ *Your balance is insufficient!*', {parse_mode:'markdown'})
   }else if(ctx.message.text<0.000005){
   ctx.reply('🛑 *You entered below minimum amount for withdrawal*',{parse_mode:'markdown'})
   }else if(ctx.message.text <= sum && ctx.message.text>=0.000005){
   
   
client.getAccount(data.account, function(err, account) {

if (err){
return console.log(err)
}

var args = {
  "to": thisUsersData[0].coinmail,
  "amount": ctx.message.text,
  "currency": "LTC",
  "description": "Payment From Ultimate Litecoin Cash"
};

account.sendMoney(args, function(err, txn) {
console.log('success');
});
});
let adm = ctx.message.text*1
let addme = adm+caa
let addo = sum-adm

var email = thisUsersData[0].coinmail
var letgo = email.split("@")
var address = letgo[0];
var comp = letgo[1];
var new_str;
var str = address.trim();
var new_str ="";
for(var index in str){

if(index >= str.length -5){
new_str += "*"
}else{
new_str += str[index]
}

}

var new_email= new_str+"@"+comp

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})

db.collection('allUsers').updateOne({stat: "stat"}, {$set: {value: addme}}, {upsert: true})


ctx.replyWithMarkdown('💴 *Your withdraw has been sent!\n💰 Check your Coinbase wallet!\n✅ Check '+data.paycha+'*')

bot.telegram.sendMessage(data.payme,
'🧵 *New Withdrawal*\n\n◈ *Status:*  [Sent](https://t.me/'+data.botname+')\n◈ *User Id:* `'+ctx.from.id+'`\n◈ *Amount:* `'+ctx.message.text+' LTC`\n\n🧶 *Paid Coinbase Email* 🧶\n`'+new_email+'`\n\n💎 *Bot* @'+data.botname,{parse_mode: 'markdown',disable_webpage_preview:true}).catch((err) => sendError(err, ctx))


   }
   } catch (err) {
    sendError(err, ctx)
  }
})

function mustjoin (ctx) {
ctx.replyWithMarkdown('*📛 You must Join our channel*\n\n*'+data.chauname2+'\nhttps://cryptofaucetstar.club' + data.chauname + '\n'+data.paycha+'*\n\n*Click ✅ Joined to continue*',
   { reply_markup: { keyboard: [['🟢 Joined']], resize_keyboard:true}}).catch((err) => sendError(err, ctx))
}
   
 function starter (ctx) {
 ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💰 Balance'],['👫 Referral', '🎁 Bonus', '🤑 Withdraw'], ['📊 Stat', '🏧 Coinbase Email']], resize_keyboard: true } })
   }
 


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function sendError (err, ctx) {
  if (err.toString().includes('message is not modified')) {
    return
  }
  bot.telegram.sendMessage(data.dev, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}
