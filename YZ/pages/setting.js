
var config = require('../config')
var util = require('../utils/util.js')


Page({
	data: {
		give_points:'',
		take_points:'',
		saving: false,
	},

	onLoad: function() {
		var that = this
		util.showBusy('查询中')
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
			  wx.hideToast()
		    },
			fail: function(res) {
			  util.showModel('请求失败', '无法连接服务器')
			},
		})
	},

	formSubmit: function(res) {
		console.log(res.detail.value)
		var that = this
		this.setData({
			saving: true,
		})
    	wx.request({
      		url: config.service.requestDBUrl,
			data: {
				name: 'setting',
				info: res.detail.value,
			},
		    method: 'POST',
            success: function (res) {
        		console.log(res.data)
				if (res.data.code == 0) {
       				util.showSuccess('保存成功')
				} else {
        			util.showModel('请求失败', '请勿留空')
				}
            },
      		fail: function (res) {
        		util.showModel('请求失败', res)
			},
			complete: function(res) {
				that.setData({
					saving: false,
				})
			}
      })
	},


})

