var hbs = require('handlebars')
var fs = require('fs')
var Github = require('github-api')

module.exports = function(callback) {
  
  fs.readFile('contributors.json', function (err, data) {
    if (err) return callback(err, "Error reading contribs file for building page.")
    
    var everyone = JSON.parse(data)
    var newest = everyone[everyone.length - 1]
    
    var stats = {featured: newest, everyone: everyone}
    getTemplate(stats)
  })

  function getTemplate(stats) {
    fs.readFile('template.hbs', function (err, data) {
      if (err) return callback(err, "Error reading template file.")
      
      data = data.toString()
      var template = hbs.compile(data)
      var HTML = template(stats)
      writeRepo(HTML, stats)
    })
  }

  function writeRepo(HTML, stats) {
    var github = new Github({
      auth: "oauth",
      token: process.env['REPOROBOT_TOKEN']
    })
    
    var repo = github.getRepo('jlord', 'patchwork')
    var username = stats.featured.username
    var commitMes = "rebuilt with @" + username + " added\!"
    
    repo.write('gh-pages', 'index.html', HTML, commitMes, function(err) {
      if (err) return callback(err, "Error writing new index to Patchwork.")
      console.log([new Date(), "REBUILT INDEX with" + username])
      
      repo.write('gh-pages', 'contributors.json', JSON.stringify(stats, null, " ") , "Added @" + username, function(err) {
        if (err) return callback(err, "Error writing contribs backup to Patchwork.")
        console.log([new Date(), "Wrote contributors backup with" + username])
      })
    })
  }
}