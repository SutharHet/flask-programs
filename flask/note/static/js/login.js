$(document).ready( () => {
  $(".validation-msg").css("display","none")
  
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
        console.log(res.token)
        setCookie('noteToken', res.token, 30)      
        window.location.replace("http://127.0.0.1:5000/dashboard")
      },
      error: () => {
        errorMsg("Server side error")
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