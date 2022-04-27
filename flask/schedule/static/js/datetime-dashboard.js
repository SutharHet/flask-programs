$(document).ready(() => {
  token = ''
  timezone = ''
  let DateTime = luxon.DateTime
  sessionStorage.removeItem("taskId")

  $('#start_time').val('00:00')
  $('#end_time').val('00:00')

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
  
  $("#add-weekly-task").click(()=>{
    window.location.replace("http://127.0.0.1:5000/add-weekly-task")    
  })
  $("#add-datetime-task").click(()=>{
    window.location.replace("http://127.0.0.1:5000/add-datetime-task")    
  })
  $("#dashboard").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")    
  })

  let getDateTimeData = () => {
    let obj ={
      type: "GET",
      url: "/datetime/schedule",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        $('.container').children().not('h3').remove();
        for(let i=0; i < data.length; i++){
          startDate = DateTime.fromISO(data[i].start_datetime, { zone: timezone })
          endDate = DateTime.fromISO(data[i].end_datetime, { zone: timezone })
              
          startDateTime = startDate.toLocaleString(DateTime.DATETIME_MED)
          endDateTime = endDate.toLocaleString(DateTime.DATETIME_MED)

          $(".container").append(`
            <div class=\"task-card\">
              <p class=\"task\">`+data[i].task+`</p> 
              <p class=\"task-datetime\">`+startDateTime+` TO `+endDateTime+`</p>
              <div class=\"btns\"> 
                <button id=\"e`+data[i].task_id+`\">Edit</button> 
                <button id=\"d`+data[i].task_id+`\">Del</button> 
              </div>
            </div>
          `)
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
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
        timezone = data.timezone
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        getDateTimeData()
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
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

  let deleteDateTimeData = (id) => {
    let obj = {
      type: "DELETE",
      url: "/datetime/tasks/"+id,
      headers: {
        'x-access-token': token
      },
      success: () => {
        getDateTimeData()  
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])  
      }
    }
    $.ajax(obj)
  }

  let editDateTimeData = (id) => {
    sessionStorage.setItem("dateTimeTaskId", id)
    window.location.replace("http://127.0.0.1:5000/add-datetime-task")  
  }

  $("#filter").on("click","#clear-btn", (event) => {
    $('#start_date').val('')
    $('#end_date').val('') 
    
    $('#start_time').val('00:00')
    $('#end_time').val('00:00') 

    getDateTimeData() 
  })

  $("#filter").on("click","#filter-btn", (event) => {
    startDate = $('#start_date').val()+'T'+$('#start_time').val()
    endDate = $('#end_date').val()+'T'+$('#end_time').val()

    utcStartDate = ''
    console.log(startDate.charAt(0), startDate.charAt(0) !== 'T')
    if (startDate.charAt(0) !== 'T'){
      console.log('here')
      startDate = DateTime.fromISO(startDate, { zone: timezone })
      utcStartDate = startDate.toUTC().toISO()
    }
    
    utcEndDate = ''
    if (endDate.charAt(0) !== 'T'){
      endDate = DateTime.fromISO(endDate, { zone: timezone })
      utcEndDate = endDate.toUTC().toISO()
    }
    
    console.log(utcStartDate, utcEndDate)
    let obj ={
      type: "GET",
      url: "/datetime/filter/schedule",
      headers: {
        'x-access-token': token
      },
      data: {
        startDate: utcStartDate,
        endDate: utcEndDate, 
      },
      success: (res) => {
        data = res.data
        console.log(data)
        $('.container').children().remove();
        for(let i=0; i < data.length; i++){
          startDate = DateTime.fromISO(data[i].start_datetime, { zone: timezone })
          endDate = DateTime.fromISO(data[i].end_datetime, { zone: timezone })
              
          startDateTime = startDate.toLocaleString(DateTime.DATETIME_MED)
          endDateTime = endDate.toLocaleString(DateTime.DATETIME_MED)

          $(".container").append(`
            <div class=\"task-card\">
              <p class=\"task\">`+data[i].task+`</p> 
              <p class=\"task-datetime\">`+startDateTime+` TO `+endDateTime+`</p>
              <div class=\"btns\"> 
                <button id=\"e`+data[i].task_id+`\">Edit</button> 
                <button id=\"d`+data[i].task_id+`\">Del</button> 
              </div>
            </div>
          `)
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    if(utcStartDate !== ''){
      console.log('here')
      $.ajax(obj)
    }

  })

  $(".container").on("click","button",(event) => {
    let btnId = event.target.id
    let method = btnId.charAt(0)
    let id = btnId.substring(1)

    if(method == "e"){
      editDateTimeData(id)
    }else{
      deleteDateTimeData(id)
    }
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/datetime-dashboard")
  })
  
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

  $("#logout").click(()=>{
    document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.replace("http://127.0.0.1:5000/login")  
  })

})