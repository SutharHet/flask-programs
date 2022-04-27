$(document).ready( () => {
  $(".validation-msg").css("display","none")
  sessionStorage.removeItem("taskId")
  document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  
  let errorMsg = (msg) => {
    $("#error-msg").html(msg)
    $(".container").css("height", "400px")
    $(".validation-msg").css("display","block")
  }

  function setCookie(cname, cvalue, exMins) {
    const d = new Date();
    d.setTime(d.getTime() + (exMins * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  let getUser = (username,password) => {
    let obj ={
      type: "POST",
      url: "/users/"+username,
      data: {
        password: password
      },
      success: (res) => {
        setCookie('scheduleToken', res.token, 30)      
        window.location.replace("http://127.0.0.1:5000/dashboard")
      },
      error: (res) => {
        resJson = res.responseJSON
        errorMsg(resJson['message'])
      }
    }
    $.ajax(obj)
  }

  $("#login").click(()=>{
    username = $("#username").val()
    password = $("#password").val()

    if(username != "" && password != ""){
      $(".validation-msg").css("display","none")
      $(".container").css("height", "300px")
      getUser(username, password)
    }else{
      errorMsg("Username or Password is empty")
    }
  })

})