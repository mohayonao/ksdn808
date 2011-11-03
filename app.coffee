express = require "express"
mongoose = require "mongoose"
fs = require "fs"

mongo_uri = process.env.MONGOHQ_URL || "mongodb://localhost/ksdn808"

Schema = mongoose.Schema
scoreSchema = new Schema sel:String, body:String

scoreSchema.pre "init", (next)->
    console.log "initialize."
    next()

scoreSchema.pre "save", (next)->
    console.log "save"
    next()

app = module.exports = express.createServer()

app.configure ->
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use express.static __dirname + "/public"
    mongoose.connect mongo_uri
    mongoose.model "Score", scoreSchema

app.configure "development", ->
    app.use express.errorHandler(dumpExceptions:true, showStack:true)

app.configure "production", ->
    app.use express.errorHandler()

Score = mongoose.model "Score"

app.get "/:id?", (req, res)->
    res.sendfile "views/index.html"

app.get "/wave/:type/:name", (req, res)->
    type = req.params.type
    name = req.params.name
    filename = "./wave/#{type}-#{name}.json"

    console.log filename
    fs.readFile filename, (err, data)->
        res.send if not err then data else "Error"

app.get "/load/:sel", (req, res)->
    sel = req.params.sel

    if not sel then res.send "[]"
    else
        # load from mongoDB
        Score.findOne sel:sel, (err, data)->
            data ?= "[]"
            res.send data.body

app.post "/", (req, res)->
    body = req.body.data

    if not body
        res.send ""
    else
        # store to mongoDB
        score = new Score()
        x = new Date().getTime() * 100 + (Math.random() * 100 | 0)

        lis = []
        while x >= 1
            lis.unshift "0123456789ABCDEFGHIJKLMNOPRQSTUVWXYZabcdefghijklmnopqrstuvwxyz+"[x & 63]
            x /= 64
        sel = lis.join ""

        score.sel = sel
        score.body = body
        score.save (err)->
            res.send if not err then sel else ""

app.listen process.env.PORT || 3000
