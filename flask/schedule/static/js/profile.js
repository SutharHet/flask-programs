$(document).ready(() => {
  user = ""
  token = ''
  $("#save").css("display","none")
  sessionStorage.removeItem("taskId")
  
  let userData = {}

  let getCookie = (cname) => {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        userData = res.data
        $("#profile span").html(userData.username.charAt(0).toUpperCase())
        $("#profile-pic span").html(userData.username.charAt(0).toUpperCase())
        $("#username").val(userData.username)
        $("#password").val(userData.password)
        $("#email").val(userData.email)
        $("#mobile-no").val(userData.mobile_no)
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    
    $.ajax(obj)
  }
  $("#profile-data input").attr("disabled", true)

  let checkCookie = () => {
    token = getCookie("scheduleToken");
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()

  $("#edit").click(()=>{
    $("#profile-data input").attr("disabled", false)
    $("#save").css("display","block")
    $("#edit").css("display","none")
  })
  
  $("#save").click(()=>{
    let user = $("#username").val()
    let password = $("#password").val()
    let email = $("#email").val()
    let mno = $("#mobile-no").val()
    
    
    let data = {
      username: user,
      password: password,
      email: email,
    }
    
    if(mno != '' && mno.length >= 10 ){
      data['mobile_no'] = mno
    }

    let obj = {
      type: "PUT",
      url: "/users",
      headers: {
        'x-access-token': token
      },
      data: data,
      success: () => {
        getUser()
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }

    $.ajax(obj)

    $("#profile-data input").attr("disabled", true)
    $("#save").css("display","none")
    $("#edit").css("display","block")
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
  
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

  $("#logout").click(()=>{
    document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.replace("http://127.0.0.1:5000/login")  
  })

})