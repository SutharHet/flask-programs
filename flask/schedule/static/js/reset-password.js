$(document).ready(() => {
  token = $('#token').val()
  sessionStorage.removeItem("taskId")
  document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  if(token == ''){
    window.location.replace("http://127.0.0.1:5000/login")    
  }
  
  $("#reset").click(()=>{
    let password = $("#password").val()
    let confirm_password = $("#confirm-password").val()
    console.log(password, confirm_password)
    let data = {
      token: token,
      password: password
    }

    if(password == confirm_password){
      if(password.length >= 8){
        let obj = {
          type: "PUT",
          url: "/reset-password",
          data: data,
          success: () => {
            window.location.replace("http://127.0.0.1:5000/login")    
          },
          error: (res) => {
            resJson = res.responseJSON
            alert(resJson['message'])
          }
        }
        
        $.ajax(obj)
      } else {
        console.log("Invelid Password")
      }
    } else {
      console.log("password does not match confirm password")
    }
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
})