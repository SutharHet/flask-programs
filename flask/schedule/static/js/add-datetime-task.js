$(document).ready(() => {
  let DateTime = luxon.DateTime

  console.log(DateTime.local().toISO())
 
  token = ''
  let data = {}
  taskId = sessionStorage.getItem("dateTimeTaskId")
  
  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/datetime-dashboard")
  })
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

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

  let setTaskData = () => {
    let obj ={
      type: "GET",
      url: "/datetime/tasks/"+taskId,
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        console.log('here2')
        data = res.data
        console.log(data)
        $("#task").val(data.task)
        
        startDate = String(DateTime.fromISO(data.start_datetime, { zone: timezone }))
        endDate = String(DateTime.fromISO(data.end_datetime, { zone: timezone }))
        startDate = startDate.split('.')
        endDate = endDate.split('.')
        $("#start-datetime").val(startDate[0])
        $("#end-datetime").val(endDate[0])
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
        window.location.replace("http://127.0.0.1:5000/datetime-dashboard") 
      }
    }
    $.ajax(obj)
  } 

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        timezone = data.timezone
        
        if(taskId != null){
          console.log('here1')
          setTaskData()
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
        window.location.replace("http://127.0.0.1:5000/datetime-dashboard") 
      }
    }
    $.ajax(obj)
  }

  let checkCookie = () => {
    token = getCookie("scheduleToken");
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()

  $('option').mousedown(function(e) {
    e.preventDefault();
    $(this).prop('selected', !$(this).prop('selected'));
    return false;
  });

  $("#add").click(()=>{
    let obj = {}
    let taskData = {}

    startDate = $("#start-datetime").val()
    endDate = $("#end-datetime").val()

    startDate = DateTime.fromISO(startDate, { zone: timezone })
    endDate = DateTime.fromISO(endDate, { zone: timezone })
 
    utcStartDate = startDate.toUTC()
    utcEndDate = endDate.toUTC()
    
    taskData = {
      task: $("#task").val(),
      start_datetime: utcStartDate.toISO(),
      end_datetime: utcEndDate.toISO(),
    }
    
    console.log(taskData)
    if (taskData.task == data.task && taskData.start_datetime == data.start_datetime && taskData.end_datetime == data.end_datetime){
      window.location.replace("http://127.0.0.1:5000/datetime-dashboard")            
    }

    if(taskId != null){
      obj = {
        type: "PUT",
        url: "/datetime/tasks/"+taskId,
        headers: {
          'x-access-token': token
        },
        data: taskData,
        success: () => {
          sessionStorage.removeItem("dateTimeTaskId")
          window.location.replace("http://127.0.0.1:5000/datetime-dashboard")  
        },
        error: (res) => {
          resJson = res.responseJSON
          alert(resJson['message'])
        }
      }
    }else{
      obj = {
        type: "POST",
        url: "/datetime/schedule",
        headers: {
          'x-access-token': token
        },
        data: taskData,
        success: () => {
          window.location.replace("http://127.0.0.1:5000/datetime-dashboard")  
        },
        error: (res) => {
          resJson = res.responseJSON
          alert(resJson['message'])
        }
      }
    }
    
    $.ajax(obj)   
  })
})