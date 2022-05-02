$(document).ready(() => {
  token = ''
  timezone = ''
  let DateTime = luxon.DateTime
  sessionStorage.removeItem("taskId")
  let dataRows = []

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
  $("#datetime-dashboard").click(()=>{
    window.location.replace("http://127.0.0.1:5000/datetime-dashboard")    
  })

  let getTimes = (startDate, endDate) => {
    startDate = DateTime.fromISO(startDate, { zone: timezone })
    endDate = DateTime.fromISO(endDate, { zone: timezone })
  
    startTime = startDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    endTime = endDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    
    return [startTime, endTime]
  }

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
  let getWeeklyData = () => {
    let obj ={
      type: "GET",
      url: "/schedules",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        $('tbody').html('')
        dataRows = []
        count = 1
        for(let j=0; j < days.length; j++){
          for(let i=0; i < data.length; i++){

            times = getTimes(data[i].start_time, data[i].end_time)
            if(data[i].days.includes(days[j])){
              // dataRows.push
              dataRows.push(`
                <tr>
                  <th scope="row">`+count+`</th>
                  <td>`+data[i].task+`</td>
                  <td>`+days[j]+`</td>
                  <td>`+times[0]+`</td>
                  <td>`+times[1]+`</td>
                  <td><button id=\"e`+data[i].task_id+`\" class="btn btn-primary">Edit</button></td>
                  <td><button id=\"d`+data[i].task_id+`\" class="btn btn-danger">Del</button></td>
                </tr>
              `)
              count++
            }
          }
          
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
        getWeeklyData()
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


  let deleteWeeklyData = (id) => {
    let obj = {
      type: "DELETE",
      url: "/tasks/"+id,
      headers: {
        'x-access-token': token
      },
      success: () => {
        getWeeklyData()  
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])  
      }
    }
    $.ajax(obj)
  }

  let editWeeklyData = (id) => {
    sessionStorage.setItem("taskId", id)
    window.location.replace("http://127.0.0.1:5000/add-weekly-task")  
  }

  $(".chosen-select").chosen({
    no_results_text: "Oops, nothing found!"
  })
  
  $("body").on("click","#clear-btn", (event) => {
    getWeeklyData()
  })
  $("body").on("click","#filter-btn", (event) => {
    taskDays = String($('#days').val()).split(',')
    console.log(taskDays)
    if(taskDays[0] == 'null'){
      getWeeklyData()
    }
    let obj ={
      type: "GET",
      url: "/schedules",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        dataRows = []

        count = 1

        for(let i=0; i < data.length; i++){
          for(let j=0; j < taskDays.length; j++){
            if(data[i].days.includes(taskDays[j])){
              
              dataRows.push(`
                <tr>
                  <th scope="row">`+count+`</th>
                  <td>`+data[i].task+`</td>
                  <td>`+taskDays[j]+`</td>
                  <td>`+times[0]+`</td>
                  <td>`+times[1]+`</td>
                  <td><button id=\"e`+data[i].task_id+`\" class="btn btn-primary">Edit</button></td>
                  <td><button id=\"d`+data[i].task_id+`\" class="btn btn-danger">Del</button></td>
                </tr>
              `)
              count++
            }
          }
        }

        paginate(dataRows)
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    $.ajax(obj)

  })

  $("table").on("click","button",(event) => {
    let btnId = event.target.id
    let method = btnId.charAt(0)
    let id = btnId.substring(1)

    if(method == "e"){
      editWeeklyData(id)
    }else{
      $("#delete-task-modal").modal("show");

      $('#delete-task-modal .modal-footer button').one('click', function(event) {
        if($(event.target)[0].id == "confirm-delete"){
          deleteWeeklyData(id)
        }
      })
    }
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