var config = require('../../config')
var util = require('../../utils/util.js')

var productes = []
//	{'title':'AA', 'num':'2', 'price':'100', 'index':0},
//	{'title':'BB', 'num':'2', 'price':'100', 'index':1}];
var total_price = 0
var commited = false;
var stashed = false;
var curr_date_time
var the_list = {};

Page({
  data: {
    total_price: '0',
	pay_price:'0',
	vip_count:'0',
	vip_count_pay:'0',
    items: productes,
    curr_time: '',
    customer: "",
	stash_loading: false,
	commit_loading: false,
  },

  onLoad: function () {
	curr_date_time = util.formatTime(new Date())
    this.setData({
      curr_time: '日期: ' + curr_date_time 
    })
	the_list.prds = new Array()
	the_list.date = curr_date_time
	the_list.pay  = 0 
  },

  cutoff_input: function(e) {
	if (e.detail.value == "") {
		return
	}
	var pay_price = total_price - parseInt(e.detail.value)
	if (pay_price < 0) {
		pay_price = 0
	}
    this.setData({
		pay_price: pay_price
    })
  },
  
  add_product: function(prd) {
    console.log('price', prd.price)
    total_price += new Number(prd.price)
    console.log('total_price:', total_price)
	stashed = false

	for (var i=0; i < productes.length; i++) {
		if (productes[i].uuid == prd.uuid) {
			productes[i].num++
			break
		}
	}
	if (i == productes.length) {
		prd.index = productes.length
		productes = productes.concat(prd)
	}

    this.setData({
        items: productes,
        total_price: total_price.toString(),
		pay_price: this.data.total_price
    })
  },

  del_product: function(index) {
	total_price -= Number(productes[index].num) * Number(productes[index].price)
	productes.splice(index, 1)
	for (var i = index; i < productes.length; i++) {
		productes[i].index = index;	
	}
    this.setData({
        items: productes,
        total_price: total_price.toString(),
		pay_price: this.data.total_price 
    })
  },

  get_product_info_from_db: function(id) {
      var that = this
      util.showBusy('正在查询')
      wx.request({
        url: config.service.requestDBUrl,
        data: {
		  name: "sale_info",
          uuid: id,
        },
        success: function(res) {
          util.showSuccess('成功')
          var item = {}
          console.log('req suss', res.data.data[0])
          item.image = res.data.data[0].image
          item.title = res.data.data[0].title
          item.price = res.data.data[0].sale_price
		  item.uuid = id
		  item.num = 1
          that.add_product(item)
        },
        fail: function(res) {
          util.showModel('请求失败', res)
        }
      })
  },


  scanCode: function() {
    var that = this
    wx.scanCode({
     // onlyFromCamera: true,
      scanType: [],
      success: function(res) {
        that.get_product_info_from_db(res.result)
      },
      fail: function(res) {
		if (res.errMsg == 'scanCode:fail') {
			util.showModel('错误', '无法识别的二维码')
		}
      },
      complete: function(res) {

      },
    })
  },

  item_move: function(e) {
	console.log(e.detail.source)
	console.log(e.target.id)
	if (e.detail.source == "touch-out-of-bounds") {
		this.del_product(Number(e.target.id))
	}
  },

  vip_num_confirm: function(e) {
	var that = this
	console.log('confirm: ' + e.detail.value)
	wx.request({
        url: config.service.requestDBUrl,
        data: {
		  name: "vip",
          uuid: e.detail.value,
        },
        success: function(res) {
			console.log('count', res.data.data)
			if (res.data.data[0].length == 0) {
				return
			}
			var count = Number(res.data.data[0].count)
			var max_pay = total_price * 0.05
			var pay = count <= max_pay ? count : max_pay
			that.setData({
				vip_count: count,
				vip_count_pay: pay.toString()
			})
        },
        fail: function(res) {
          util.showModel('请求失败', res)
        }
	})
  },

  generate_list_info: function() {
	for (var i=0; i < productes.length; i++) {
		var item = {}
		item.uuid = productes[i].uuid
		item.num = productes[i].num
		item.price = productes[i].price
		item.customer = this.data.customer 

		console.log(item.price)

		if (item.price == undefined) {
			wx.showModal({
			  title: '价格错误',
			  showCancel:false,
			})
			return -1
		}
		the_list.prds = the_list.prds.concat(item)
	}
	the_list.pay  = this.data.pay_price
	return 0
  },

  stash: function (e) {
    console.log('stash', productes)
    if (stashed == true) {
      return;
    }
    stashed = true

	if (this.generate_list_info() < 0) {
		return
	}
	this.setData({
		stash_loading: true,
	})
	var that = this

    wx.request({
      url: config.service.requestDBUrl,
      data: {
        name: 'stash',
        info: the_list,
      },
      method: 'POST',
      success: function (res) {
        console.log(res.data)
		if (res.data.code == 0) {
       		util.showSuccess('保存成功')
		} else {
			util.showModel('保存失败', res)
			stashed = false
		}
      },
      fail: function (res) {
        util.showModel('保存失败', res)
        stashed = false
      },
	  complete: function(res) {
		that.setData({
			stash_loading: false,
		})
	  }
    })  
  },

  commit: function (e) {
    if (commited == true) {
      return;
    } 
    commited = true

	if (this.generate_list_info() < 0) {
		return
	}
	this.setData({
		commit_loading: true,
	})
	var that = this

    wx.request({
      url: config.service.requestDBUrl,
      data: {
        name: 'out',
        info: the_list,
      },
      method: 'POST',
      success: function (res) {
        console.log(res.data)
        wx.showModal({
          title: '交易成功',
          showCancel:false,
          complete: function (res) {
            wx.navigateBack({
              delta:1
            })
          }
        })
      },
      fail: function (res) {
        util.showModel('请求失败', res)
        commited = false
      },
	  complete: function(res) {
		that.setData({
			commit_loading: false,
		})
	  }
    })
  },

})
