
const express = require('express')

const app = express()

const PORT = '8080'

app.listen(PORT, async () => {
  console.log(`🚀 server is running`)
  require('./index')
})