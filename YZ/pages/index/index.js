var config = require('../../config')
var util = require('../../utils/util.js')

var productes = []
//	{'title':'AA', 'num':'2', 'price':'100', 'index':0},
//	{'title':'BB', 'num':'2', 'price':'100', 'index':1}];
var commited = false;
var stashed = false;
var curr_date_time

var the_list = {};

var stash_num = 0;
var setting_data_req = 0;

Page({
  data: {
    total_price: 0,
	pay_price:0,
	vip_points: 0,
	vip_deduct: '0',
    items: productes,
	item_num: productes.length,
    curr_time: '',
    vip_number: '',
	stash_loading: false,
	commit_loading: false,
	scrollHeight: 0,
	stash_text: '保存',
	take_points: 0,
	give_points: 0,
  },

  varInit: function() {
	curr_date_time = util.formatTime(new Date())
	the_list.prds = new Array()
	the_list.date = curr_date_time
	the_list.pay  = 0 
	productes = []
	commited = false;
    this.setData({
      curr_time: '日期: ' + curr_date_time,
      items: productes,
	  item_num: 0,
      total_price: 0,
	  pay_price:0,
	  vip_points: 0,
	  vip_deduct: '0',
      vip_number: '',
	  
    })
  },

  onLoad: function () {
	this.varInit()
	var that = this
	wx.getSystemInfo({
		success: function(res) {
			console.log(res.windowHeight)
			that.setData({
	  			scrollHeight: res.windowHeight - 170,
			})
		}
	})
//	this.scanCode()
  },

  price_change: function() {
	 var max = parseInt(this.data.total_price * this.data.take_points / 1000)
	 var vip_deduct = this.data.vip_points <= max ? this.data.vip_points: max
	 this.setData({
		vip_deduct: vip_deduct.toString(),
		pay_price: this.data.total_price - vip_deduct,
	 })
	 the_list.vip_points = this.data.vip_points - this.data.vip_deduct +
		  				parseInt(this.data.pay_price * this.data.give_points / 1000)
	 console.log("vip_points:", the_list.vip_points)
  },

	/*
  discount_input: function(e) {
	if (e.detail.value == "") {
		the_list.discount = 0
	} else {
		the_list.discount = Number(e.detail.value);
	}
	this.price_change()
  }, */

  price_input: function(e) {
	var price
	console.log(e);
	if (e.detail.value == "") {
		price = 0
	} else {
		price = Number(e.detail.value);
	}
	var index = e.target.id
	var total_price = this.data.total_price - (productes[index].price - price) * productes[index].num
	productes[index].price = price
    this.setData({
		total_price: total_price,
	})
	this.price_change()
  },


  
  add_product: function(prd) {
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
	var total_price = this.data.total_price + productes[i].price

    this.setData({
        items: productes,
		item_num: productes.length -1 ,
		total_price: total_price,
    })
	
	this.price_change()
  },

  del_product: function(index) {
	var total_price = this.data.total_price - Number(productes[index].num) * Number(productes[index].price)
	productes.splice(index, 1)
	for (var i = index; i < productes.length; i++) {
		productes[i].index = index;	
	}
    this.setData({
        items: productes,
		item_num: productes.length -1,
		total_price: total_price,
    })
	this.price_change()
  },

  request_setting_data: function() {
    var that = this
	wx.request({
		url: config.service.requestDBUrl,
		data: {
		  name: "setting",
		},
		success: function(res) {
		  console.log(res)
		  if (res.data.data.length != 0 && Object.keys(res.data.data).length!=0) {
			  that.setData({
				give_points: res.data.data[0].give_points.toString(),
				take_points: res.data.data[0].take_points.toString()
			  })
		  }
		},
		fail: function(res) {
		  util.showModel('请求失败', '无法连接服务器')
		},
	})
  },

  get_product_info_from_db: function(id) {

	  if (setting_data_req == 0) {
		  setting_data_req = 1;
		  this.request_setting_data();
	  }

      var that = this
      util.showBusy('正在查询')
      wx.request({
        url: config.service.requestDBUrl,
        data: {
		  name: "sale_info",
          uuid: id,
        },
        success: function(res) {
		  if (res.data.data.length == 0) {
			wx.showModal({
			  title: '商品信息不存在',
			  showCancel:false,
			})
		  } else {
			  //util.showSuccess('成功')
			  var item = {}
			  console.log('req suss', res.data.data[0])
			  item.image = res.data.data[0].image
			  item.title = res.data.data[0].title
			  item.price = res.data.data[0].sale_price
			  item.uuid = id
			  item.num = 1
			  that.add_product(item)
		  }
		  wx.hideToast()
        },
        fail: function(res) {
          util.showModel('请求失败', res)
        },
		complete: function(res) {
         // util.showModel('OK', res)
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
	if (e.detail.value.length == 0) {
		return
	}
	the_list.vip_name = e.detail.value

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
			that.setData({
				vip_points: Number(res.data.data[0].count)
			})
			that.price_change()
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

		console.log(item.price)

		if (item.price == undefined) {
			wx.showModal({
			  title: '价格错误',
			  showCancel:false,
			})
			return -1
		}
		the_list.prds = the_list.prds.concat(item)
		console.log('item:', item);
		console.log('list:', the_list);
	}
	the_list.pay    = this.data.pay_price
	return productes.length 
  },

  show_my_place: function () {
	wx.showActionSheet({
	itemList: ['添加商品', '设置'],
    success: function(e) {
		console.log(e.tapIndex)
		if (e.tapIndex == 0) {
		  wx.navigateTo({
        	url: '../main/in',
		  })
		} if (e.tapIndex == 1) {
		  wx.navigateTo({
        	url: '../setting',
		  })
		}
	}
	})
  },

  getUserInfo: function(e) {
    console.log(e)
	if (e.detail.errMsg == "getUserInfo:ok") {
		this.show_my_place()
	}
  },

  stash: function (e) {
    console.log('stash', productes)
    if (stashed == true) {
      return;
    }
    stashed = true

	if (this.generate_list_info() <= 0) {
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
			stash_num += 1
			console.log(stash_num);
			that.setData({
				stash_text: '保存(' + stash_num.toString() + ')',
			})
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

  commit_list: function() {
	this.setData({
		commit_loading: true,
	})
	var that = this
	

    commited = true

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
			that.varInit()
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

  commit: function (e) {
    if (commited == true) {
      return;
    } 

	if (this.generate_list_info() <= 0) {
		return
	}

	var that = this

	wx.showModal({
		title: '确认提交订单',
		success: function(res) {
			if (res.confirm) {
				that.commit_list()
			}
		}
	})
  },

})
