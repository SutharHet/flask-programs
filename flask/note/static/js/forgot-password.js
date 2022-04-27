$(document).ready(() => {
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
      error: () => {
        console.log("Err updating user data")
      }
    }
    
    $.ajax(obj)
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
})