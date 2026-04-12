// const fs = require('fs');
// const path = require('path');
// const directoryPath = path.join(__dirname, '../_locales/am'); // 替换为你的文件夹名称

const fs = require('fs')
const path = require('path')

const directoryPath = path.join(__dirname, '../_locales/') // 替换为你的文件夹名称
const resultArr = []
try {
  const files = fs.readdirSync(directoryPath)
  files.forEach((file) => {
    console.log(file) // 输出文件名
    let fileName = file
    const directoryPath = path.join(__dirname, `../_locales/${file}`)
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return console.log('Unable to scan directory: ' + err)
      }
      files.forEach(function (file) {
        if (path.extname(file) === '.json') {
          const filePath = path.join(directoryPath, file)
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.log('Error reading file: ' + err)
            } else {
              const obj = JSON.parse(data)
              // console.log(fileName)
              // console.log(obj); // 处理你的JSON对象
              resultArr.push({
                fileName,
                name: obj.name.message
              })
              console.log('--------------------------')
              console.log(JSON.stringify(resultArr))
            }
          })
        }
      })
    })
  })
} catch (err) {
  console.log('读取文件夹错误:', err)
}
