# 打卡项目  
本人对于各种站点为了吸引用户而设置打卡行为表示强烈的谴责,因此做了这个程序每日打卡.  
  
# 安装  
  
    docker run --name [containerName] -v [localDirectory contain taobao.js]:/mnt -p 7777:7777 oopschen/casperjs:1.1.0-beta3 /mnt/taobao.js [username] [userpwd]
      
# 启动  
    docker start -a [containerName]
  
# 支持站点  
* www.xiami.com  
