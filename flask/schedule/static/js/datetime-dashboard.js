$(document).ready(() => {
  token = ''
  timezone = ''
  let DateTime = luxon.DateTime
  sessionStorage.removeItem("taskId")
  dataRows = []

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

  let paginate = (dataRows) => {
    $('tbody').children().remove()
    $('.page-no').pagination({
      dataSource: dataRows,
      pageSize: 10,
      pageNumber: 1,
      showGoInput: true,
      showGoButton: true,
      autoHidePrevious: true,
      autoHideNext: true,
      showPageNumbers: true,
      showPrevious:true,
      showNext:true,
      className: 'paginationjs-theme-blue',
      callback: function(data, pagination) {
          $('tbody').html(data);
      }
    })

    $('.J-paginationjs-go-button').addClass("btn")
  }

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
        dataRows = []
        count = 1

        for(let i=0; i < data.length; i++){
          startDate = DateTime.fromISO(data[i].start_datetime, { zone: timezone })
          endDate = DateTime.fromISO(data[i].end_datetime, { zone: timezone })
              
          startDateTime = startDate.toLocaleString(DateTime.DATETIME_MED)
          endDateTime = endDate.toLocaleString(DateTime.DATETIME_MED)

          dataRows.push(`
            <tr>
              <th scope="row">`+count+`</th>
              <td>`+data[i].task+`</td>
              <td>`+startDateTime+`</td>
              <td>`+endDateTime+`</td>
              <td><button id=\"e`+data[i].task_id+`\" class="btn btn-primary">Edit</button></td>
              <td><button id=\"d`+data[i].task_id+`\" class="btn btn-danger">Del</button></td>
            </tr>
          `)
          count++
        }
        
        paginate(dataRows)
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
    getDateTimeData() 
  })

  $("#filter").on("click","#filter-btn", (event) => {
    startDate = $('#start_datetime').val()
    endDate = $('#end_datetime').val()

    utcStartDate = ''
    if (startDate.charAt(0) !== 'T'){
      startDate = DateTime.fromISO(startDate, { zone: timezone })
      utcStartDate = startDate.toUTC().toISO()
    }
    
    utcEndDate = ''
    if (endDate.charAt(0) !== 'T'){
      endDate = DateTime.fromISO(endDate, { zone: timezone })
      utcEndDate = endDate.toUTC().toISO()
    }
    
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
        dataRows = []
        count = 1

        for(let i=0; i < data.length; i++){
          startDate = DateTime.fromISO(data[i].start_datetime, { zone: timezone })
          endDate = DateTime.fromISO(data[i].end_datetime, { zone: timezone })
              
          startDateTime = startDate.toLocaleString(DateTime.DATETIME_MED)
          endDateTime = endDate.toLocaleString(DateTime.DATETIME_MED)

          dataRows.push(`
          <tr>
            <th scope="row">`+count+`</th>
            <td>`+data[i].task+`</td>
            <td>`+startDateTime+`</td>
            <td>`+endDateTime+`</td>
            <td><button id=\"e`+data[i].task_id+`\" class="btn btn-primary">Edit</button></td>
            <td><button id=\"d`+data[i].task_id+`\" class="btn btn-danger">Del</button></td>
          </tr>
          `)
          count++
        }

        paginate(dataRows)
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    if(utcStartDate !== ''){
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
      $("#delete-task-modal").modal("show");

      $('#delete-task-modal .modal-footer button').one('click', (event) => {
        if($(event.target)[0].id == "confirm-delete"){
          deleteDateTimeData(id)
        }
      })
      
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