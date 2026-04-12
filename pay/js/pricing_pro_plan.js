$(function () {
  initData()
})
//获取参数方法
function getHref() {
  var url = decodeURI(location.search)
  var theRequest = new Object()
  if (url.indexOf('?') != -1) {
    var str = url.substr(1)
    strs = str.split('&')
    for (var i = 0; i < strs.length; i++) {
      theRequest[strs[i].split('=')[0]] = unescape(strs[i].split('=')[1])
    }
  }
  return theRequest
}
/**
 * @description: 初始化数据
 * @return {*}
 */
function initData() {
  let data = JSON.parse(getHref().planList)
  console.log(data)
  const $menuItems = $('.container-menu ul li')
  const $priceTabs = $('.price-tab')
  const tabHasPlan = new Array($priceTabs.length).fill(false)
  data.forEach((item) => {
    if (!item.enablingStatus) {
      return
    }
    const $plan = $(`${item.className}`)
    if ($plan.length) {
      const tabIndex = $priceTabs.index($plan.closest('.price-tab'))
      if (tabIndex !== -1) {
        tabHasPlan[tabIndex] = true
      }
    }
  })

  $priceTabs.each(function (index) {
    if (tabHasPlan[index]) {
      $menuItems.eq(index)?.show()
    } else {
      $(this)?.hide()
      $menuItems.eq(index)?.hide()
    }
  })

  if (tabHasPlan[0]) {
    $menuItems.eq(0)?.text('Free&Trial')
  }
  const yearlyIndex = 2
  // 找到第一个activeGroup为true的元素
  const firstActiveGroup = data.find((item) => item.activeGroup && item.enablingStatus)
  let activeIndex = -1
  if (firstActiveGroup) {
    const $plan = $(`${firstActiveGroup.className}`)
    if ($plan.length) {
      activeIndex = $priceTabs.index($plan.closest('.price-tab'))
    }
  }
  const defaultIndex = tabHasPlan[yearlyIndex]
    ? yearlyIndex
    : activeIndex !== -1 && tabHasPlan[activeIndex]
      ? activeIndex
      : tabHasPlan.findIndex((item) => item)
  if (defaultIndex !== -1) {
    $menuItems.eq(defaultIndex)?.addClass('active-li')
    $priceTabs?.each(function (index) {
      if (index === defaultIndex) {
        $(this)?.show()
      } else {
        $(this)?.hide()
      }
    })
  }
  data.forEach((item) => {
    fillPlan(item)
  })
}

function fillPlan(data) {
  if (!data.enablingStatus) {
    return false
  }
  const $plan = $(`${data.className}`)
  if (data.active) {
    $plan.children().addClass('active')
  }
  $plan.show()
  $plan.find('.trial-count').text(data.count)
  $plan.find('.trial-day').text(data.day)

  $plan
    .find('.trial-click')
    .off('click')
    .on('click', function () {
      openOrder(data.code, data.planName)
    })

  const hasPromoPricing = $plan.find('.promo-pricing').length > 0
  if (hasPromoPricing) {
    const monthlyPrice = getMonthlyPrice(data)
    $plan.find('.trial-month-price').text(monthlyPrice)
    $plan.find('.future-pricing').text(`${data.price}`)
    $plan.find('.trial-price').text(`${data.price}`)
    $plan.find('.trial-original-price').text(`(${data.originalPrice})`)
  } else {
    $plan.find('.trial-price').html(
      `${data.price} &nbsp;<s class="trial-original-price" style="color: #ccc">(${data.originalPrice})</s>`
    )
  }
}

function getMonthlyPrice(data) {
  if (data.planGroup === 2) {
    return (data.price / (1 * data.count)).toFixed(1)
  }

  if (data.planGroup === 3) {
    return (data.price / (6 * data.count)).toFixed(1)
  }
  if (data.planGroup === 4) {
    return (data.price / (12 * data.count)).toFixed(1)
  }
  return `${data.price}`
}

changePriceTabs()
function changePriceTabs() {
  const lis = document.querySelectorAll('.container-menu ul li')
  const priceTabs = document.querySelectorAll('.price-tab')
  lis.forEach((item, i) => {
    item.addEventListener('click', function (e) {
      priceTabs.forEach((temp, j) => {
        if (i == j) {
          $(temp).show()
        } else {
          $(temp).hide()
        }
      })
      lis.forEach((itemK, k) => {
        if (i == k) {
          $(itemK).addClass('active-li')
        } else {
          $(itemK).removeClass('active-li')
        }
      })
    })
  })
}

async function openOrder(plink_id, planName) {
  // async function openOrder(planName) {
  //   const plink_id = 'plink_1RvVaeBNqRnfJH4Pwymq4oX8'
  sendLog(908301, { s_plan: planName })
  const loadingContainer = document.querySelector('.loading-container')
  loadingContainer.classList.remove('hide')
  const { userPhoneNum } = await chrome.storage.local.get('userPhoneNum')
  const metadata = {
    extension_type: 2,
    plink_id: plink_id,
    whatsapp_number: userPhoneNum
  }
  let requestObj = {
    payment_method: 'card',
    currency: 'usd',
    metadata: metadata
  }

  // 通过background script发送请求，避免CORS问题
  chrome.runtime.sendMessage({
    type: 'makeOrder',
    requestObj: requestObj
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'makeOrderResponse') {
    const response = request.data
    if (response) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { url: response.data.url })
          const loadingContainer = document.querySelector('.loading-container')
          loadingContainer.classList.add('hide')
        }
      })
    } else {
      const loadingContainer = document.querySelector('.loading-container')
      loadingContainer.classList.add('hide')
    }
  }
})

$(`#plan-free`).on('click', () => {
  freeUseNow()
})

function freeUseNow() {
  window.close()
}

let basicLogInfo = getBasicLogInfo()

const domFree = document.querySelector('#plan-free')
const domOneDollar = document.querySelector('#plan-1')
const domNineDollar = document.querySelector('#plan-9')
const domTwentyDollar = document.querySelector('#plan-20')

// domeChange()
function domeChange() {
  let href = window.location.href.split('?permissionInfo=')[1]
  let dome = document.getElementsByClassName('pc-price pc-price-7')
  if (href) {
    if (href == '1_7') {
      sendLog(908309, { s_plan: 2 })
    } else if (href == '9_30') {
      dome[1].className = 'pc-price pc-price-7 active text-center'
      domNineDollar.innerHTML = 'Current'
      domNineDollar.className = 'pc-btn pc-btn-7 current'
      dome[2].className = 'pc-price pc-price-7 text-center'
      domTwentyDollar.innerHTML = 'ORDER MORE'
      sendLog(908309, { s_plan: 3 })
    } else if (href == '20_30') {
      dome[2].className = 'pc-price pc-price-7 active text-center'
      domTwentyDollar.innerHTML = 'Current'
      domTwentyDollar.className = 'pc-btn pc-btn-7 current'
      dome[1].className = 'pc-price pc-price-7 text-center'
      domNineDollar.innerHTML = 'ORDER MORE'
      sendLog(908309, { s_plan: 4 })
    }
    document.getElementsByClassName('pc-price pc-price-7 active text-center')[0].onmouseover =
      function (e) {
        document
          .getElementsByClassName('pc-price pc-price-7 active text-center')[0]
          .getElementsByClassName('pc-btn pc-btn-7')[0].innerHTML = 'ORDER MORE'
      }
    document.getElementsByClassName('pc-price pc-price-7 active text-center')[0].onmouseout =
      function (e) {
        document
          .getElementsByClassName('pc-price pc-price-7 active text-center')[0]
          .getElementsByClassName('pc-btn pc-btn-7')[0].innerHTML = 'Current'
      }
  } else {
    sendLog(908309, { s_plan: 1 })
  }
}

function getBasicLogInfo() {
  const res = {}
  const url = new URL(location.href)
  const iter = url.searchParams.entries()

  let result = iter.next()
  while (!result.done) {
    const [k, v] = result.value
    res[k] = v
    result = iter.next()
  }
  return res
}

function sendLog(code, otherParams) {
  console.log('sendLog')
  let params = {
    ...basicLogInfo,
    event_source: 9,
    event_type: code,
    event_time: Math.round(new Date() / 1000),
    ...otherParams
  }
  logger.logger.send(params)
}

domFree?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 1 })
})

domOneDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 2 })
})

domNineDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 3 })
})

domTwentyDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 4 })
})
