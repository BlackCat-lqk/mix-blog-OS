import DisableDevtool from 'disable-devtool';
export const switchDebugger = (val: boolean) => {
  // 无限debugger
  if(val) return
  DisableDevtool()
  const ban = () => {
    setInterval(() => {
      // Function('debugger')()
      (function(){
        return false
      }['constructor']('debugger')['call']())
    }, 50)
  }
  try{
    ban()
  }catch(err){
    console.log(err)
  }
  // 检查窗口尺寸变化
  const block = () => {
    if(window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200){
      document.body.innerHTML = 'Illegal Debugging'
    }
  }
  setInterval(block, 1000)
  // 禁止右键菜单
  document.oncontextmenu = () => {
    return false
  }
  // 禁止F12
  document.onkeydown = (e) => {
    if(e.key === 'F12'){
      return false
    }
  }
}


