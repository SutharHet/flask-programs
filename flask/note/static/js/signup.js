$(document).ready(() => {
  $(".validation-msg").css("display","none")

  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

  let errorMsg = (msg, marginTop="5px") => {
    $("#error-msg").html(msg)
    $(".container").css("height", "450px")
    $("ul").css("margin-top", marginTop)
    $(".validation-msg").css("display","block")
  }

  let addUser = (dataObj) => {
    let obj = {
      type: "POST",
      url: '/users',
      data: dataObj,
      success: (data) => {
        window.location.replace("http://127.0.0.1:5000/login")
      },
      error: () => {
        errorMsg("Error in adding user")
      }
    }
    $.ajax(obj)
  }

  $("#signin").click(()=>{
    let username = $("#username").val()
    let email = $("#email").val()
    let password = $("#password").val()
    let confirmPassword = $("#confirm-password").val()

    if(username != '' && email != '' && password != '' && confirmPassword != ''){
      if(emailRegex.test(email)){
        if(password == confirmPassword){
          if(password.length >= 8){
            let dataObj = {
              username: username,
              password: password,
              email: email
            }
            addUser(dataObj)
          }else{
            errorMsg("password length should be 8 or higher")
          }
        }else{
          errorMsg("confirm password should be same as password", "0")
        }
      }else{
        errorMsg("Invelid Email")
      }
    }else{
      errorMsg("all field must be filled")
    }
  })
  
})