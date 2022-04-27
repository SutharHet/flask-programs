$(document).ready(() => {
  document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  token = ''

  
  $("#send-email").click(()=>{
  
    let obj = {
      type: "POST",
      url: "/send-reset-email",
      data: {
        username: $("#username").val()
      },
      success: () => {
        window.location.replace("http://127.0.0.1:5000/login")    
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    
    $.ajax(obj)
  })

})