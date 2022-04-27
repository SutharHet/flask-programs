$(document).ready(() => {
  token = ''

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
  
  

  $("#add-note").click(()=>{
    window.location.replace("http://127.0.0.1:5000/add-note")    
  })

  let getData = (userId) => {
    let obj ={
      type: "GET",
      url: "/notes",
      headers: {
        'x-access-tokens': token
      },
      success: (data) => {
        $("div.container").empty()
        for(let i=0; i < data.length; i++){
          $("div.container").append("<div class=\"note-card\"> <p class=\"note-title\">"+data[i].title+"</p> <div class=\"btns\"> <button id=\"e"+data[i].note_id+"\">Edit</button> <button id=\"d"+data[i].note_id+"\">Del</button> </div></div>")
        }
      },
      error: () => {
        console.log("Error geting data")
      }
    }
    $.ajax(obj)
  }

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-tokens': token
      },
      success: (data) => {
        $("div.container").empty()
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        getData()
      },
      error: () => {
        console.log("Server side error")
      }
    }
    console.log(token)
    $.ajax(obj)
  }

  let checkCookie = () => {
    token = getCookie("noteToken")
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()

  let deleteData = (id) => {
    let obj = {
      type: "DELETE",
      url: "/notes/"+id,
      headers: {
        'x-access-tokens': token
      },
      success: () => {
        getData()  
      },
      error: () => {
        console.log("Error deleting data")  
      }
    }
    $.ajax(obj)
  }

  let editData = (id) => {
    sessionStorage.setItem("noteId", id)
    window.location.replace("http://127.0.0.1:5000/add-note")  
  }

  $(".container").on("click","button",(event) => {
    let btnId = event.target.id
    let method = btnId.charAt(0)
    let id = btnId.substring(1)

    if(method == "e"){
      editData(id)
    }else{
      deleteData(id)
    }
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
  
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

  $("#logout").click(()=>{
    document.cookie = 'noteToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.replace("http://127.0.0.1:5000/login")  
  })

})