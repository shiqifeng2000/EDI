/**
 * 作者：石奇峰
 * 功能：企业授信补充匹配器，用于防止解析excel大文件造成的阻塞所做
 * 相似：企业授信匹配器，个人订单匹配器，企业订单匹配器，企业订单补充匹配器，个人订单补充匹配器
 * */
var {logger, XLSX, path, fs, getSheetValue,uuidv4} = require("../util")

process.on('uncaughtException', (err) => {
  logger.error(err)
  if (process.send) {
    process.send({
      success: false,
      message: err&&err.message||"服务器出错"
    });
  }
  setTimeout(function () {
    process.exit()
  }, 200)
});
logger.info(`子进程启动，pid = ${process.pid}, argv = ${JSON.stringify(process.argv)}`)
// 取得参数数据
let unmatched = [], matched=[],attachments = [], [file, voucher] = process.argv.slice(2), workbook = XLSX.readFile(file),
  sheet = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
let vouchers = JSON.parse(fs.readFileSync(voucher, {encoding: "utf8"})),
  shiftVouchers = vouchers.map(r => (typeof r == "string") ? r.toLowerCase() : new String(r).toLowerCase());
if (!vouchers.length) {
  throw new Error("没有发现任何用户资料包")
}
XLSX.utils.sheet_to_json(sheet).forEach(r => {
  let row = {
    borrow_name: getSheetValue(r["借款人名称"]),
    borrow_business_license: getSheetValue(r["营业执照号"])
  }
  let rawnameKey = `${row.borrow_name}${row.borrow_business_license}`
  let nameKey = rawnameKey.toLowerCase();

  // 20种上传文件的可能性
  let possibleFiles = [`${nameKey}.rar`,
    `${nameKey}.zip`,
    `${nameKey}.jpg`,
    `${nameKey}.png`,
    `${nameKey}.pdf`,
    `身份证${nameKey}.rar`,
    `身份证${nameKey}.zip`,
    `身份证${nameKey}.jpg`,
    `身份证${nameKey}.png`,
    `身份证${nameKey}.pdf`,
    `电子签章${nameKey}.rar`,
    `电子签章${nameKey}.zip`,
    `电子签章${nameKey}.jpg`,
    `电子签章${nameKey}.png`,
    `电子签章${nameKey}.pdf`,
    `补充资料${nameKey}.rar`,
    `补充资料${nameKey}.zip`,
    `补充资料${nameKey}.jpg`,
    `补充资料${nameKey}.png`,
    `补充资料${nameKey}.pdf`];
  let rawPossibleFiles = [`${rawnameKey}.rar`,
    `${rawnameKey}.zip`,
    `${rawnameKey}.jpg`,
    `${rawnameKey}.png`,
    `${rawnameKey}.pdf`,
    `身份证${rawnameKey}.rar`,
    `身份证${rawnameKey}.zip`,
    `身份证${rawnameKey}.jpg`,
    `身份证${rawnameKey}.png`,
    `身份证${rawnameKey}.pdf`,
    `电子签章${rawnameKey}.rar`,
    `电子签章${rawnameKey}.zip`,
    `电子签章${rawnameKey}.jpg`,
    `电子签章${rawnameKey}.png`,
    `电子签章${rawnameKey}.pdf`,
    `补充资料${rawnameKey}.rar`,
    `补充资料${rawnameKey}.zip`,
    `补充资料${rawnameKey}.jpg`,
    `补充资料${rawnameKey}.png`,
    `补充资料${rawnameKey}.pdf`];

  let usefulVouchers = possibleFiles.map((r,i)=>shiftVouchers.includes(r)?rawPossibleFiles[i]:undefined).filter(r=>r);
  /*let usefulVouchers = vouchers.filter(r => {
    var t = (typeof r == "string") ? r.toLowerCase(): new String(r).toLowerCase();
    let escapedNameKey = RegExp.escape(nameKey)
    if(new RegExp(`^${escapedNameKey}(\\.rar|\\.zip|\\.jpg|\\.png|\\.pdf)$`).test(t) || new RegExp(`^(身份证|电子签章|补充资料)${escapedNameKey}(\\.rar|\\.zip|\\.jpg|\\.png|\\.pdf)$`).test(t)){
      !attachments.includes(r)&&(attachments.push(r))
      return true
    }
    return false
  })*/
  if (!row.borrow_name) {
    row._reason = "借款人名称为空"
  } else if (!row.borrow_business_license) {
    row._reason = "营业执照号为空"
  } else if (!usefulVouchers.length){
    row._reason = "无匹配资料"
  }
  if(row._reason){
    unmatched.push(row)
    return
  }
  row.borrow_credit_voucher_details = usefulVouchers
  matched.push(row)
  return
});

let resultString = JSON.stringify({matched, unmatched, attachments})
logger.info(`数据已读取 ==> `)

let tempFile = path.resolve(`${__dirname}/../../temp/${uuidv4()}`), fd = fs.openSync(tempFile, 'w+')
fs.writeFileSync(fd, resultString)

process.send && (typeof process.send == "function") && process.send({
  success: true,
  file: tempFile
});

setTimeout(function () {
  process.exit()
}, 200)
