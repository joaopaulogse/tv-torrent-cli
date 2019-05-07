const Webtorrent = require("webtorrent-hybrid");
const client = new Webtorrent();
const fs = require("fs");

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

module.exports = (magnetLink, spinner, dir) => {
    let length;
    return new Promise((resolve, reject) => {

        client.add(magnetLink, (torrent) => {
            const {files} = torrent;
            length = files.length;
            files.forEach(file => {
                const source = file.createReadStream()
                const destination = fs.createWriteStream(`${dir}/${file.name}`)
                source.on("data", ()=>{
                    spinner.text = `Downloading torrent: ${file.name}
                        Size: ${formatBytes(file.length)}
                        Download: ${formatBytes(torrent.downloaded)}
                        Upload: ${formatBytes(torrent.uploaded)} 
                        Speed Dowload: ${formatBytes(torrent.downloadSpeed)}
                        Speed Upload: ${formatBytes(torrent.uploadSpeed)}
                        Progress: ${(torrent.progress * 100).toFixed(2)}%`
                })
                source.on("error", (error)=>{
                    spinner.fail(error.message)
                    reject(error);
                })
                source.on("end", () => {
                    
                    length -= 1;
                    if(!length) {
                        spinner.succeed()
                        resolve(length);
                    }
                }).pipe(destination)
            })
            
        })
    })
}