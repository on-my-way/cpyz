var config = require('../../config')
var util = require('../../utils/util.js')

var productes = []
var total_price = 0
var the_list = {};
var commited = false;
var img_uploading = 0;

Page({
  data: {
    curr_time: '',
	total_price: "0", 
    items: productes,
  },

  onLoad: function (option) {
    var time = util.formatTime(new Date())
    the_list.date = time
    the_list.prds = new Array()
    this.setData ({
      curr_time: '日期: ' + time
    })
  },

  openCamera: function(e) {
    var img_index = e.currentTarget.dataset.type
    var that = this
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        productes[img_index].image = res.tempFilePaths[0];
        that.setData({
          items: productes
        })
        img_uploading++
        wx.uploadFile({
          url: config.service.uploadUrl,
          filePath: res.tempFilePaths[0],
          name: 'file',
          success: function (e) {
            var obj = JSON.parse(e.data);
            console.log('upload res', obj)
            productes[img_index].img_url = obj.data.imgUrl
          },
          fail: function (e) {
            console.log(e.data)
          },
          complete: function (e) {
            img_uploading--
            console.log('upload img ok', img_uploading)
          }
        })

      }
    })
  },

	input: function(e) {
		var value = e.detail.value
		var id = e.target.id.split(':')
		if (id[0] == 'title') {
			productes[parseInt(id[1])].title = value
			return
		} else if (id[0] == 'price') {
			productes[parseInt(id[1])].in_price = value
		} else if (id[0] == 'num') {
			productes[parseInt(id[1])].num = parseInt(value)
		}
		total_price = 0
		for (var i=0; i < productes.length; i++) {
			total_price += parseInt(productes[i].in_price) * parseInt(productes[i].num)
		}
		this.setData({
			total_price: total_price.toString()
		})
	},

	check: function(e) {
		var index = parseInt(e.target.id)
		productes[index].checked = e.detail.value.length ? true : false
		console.log('check', index, productes[index].checked)
	},

  add_product: function (prd) {
		console.log('price', prd.in_price)

		for (var i = 0; i < productes.length; i++) {
			if (prd.uuid == productes[i].uuid) {
				return;
			}
		}
		
		total_price += Number(prd.in_price) * Number(prd.num)

		prd.index = productes.length
		prd.checked = false 
		productes = productes.concat(prd)

		this.setData({
		  items: productes,
		  total_price: total_price.toString()
		})
  },

  get_product_info_from_db: function (uuid) {
    var that = this
    util.showBusy('正在查询')
    wx.request({
      url: config.service.requestDBUrl,
      data: {
        name: 'detail_info',
        uuid: uuid,
      },
      success: function (res) {
        wx.hideToast();
        var item = {}
        console.log('req suss', res.data.data)
        if (res.data.data.length > 0) {
          item.uuid = uuid
          item.num = res.data.data[0].num
          item.image = res.data.data[0].image
          item.title = res.data.data[0].title
          item.in_price = res.data.data[0].in_price
		  item.in_price_disabel = true
          item.sale_price = res.data.data[0].sale_price
		  console.log(item)
          that.add_product(item)
        } else {
          item.uuid = uuid
          item.num = '1'
          item.image = ''
          item.title = ''
          item.in_price = ''
		  item.in_price_disabel = false 
          item.sale_price = '0'
          that.add_product(item)
        }
      },
      fail: function (res) {
        util.showModel('请求失败', res)
      }
    })
  },

  scanCode: function () {
    var that = this
    wx.scanCode({
      // onlyFromCamera: true,
      scanType: [],
      success: function (res) {
        that.get_product_info_from_db(res.result)
      },
      fail: function (res) {
		console.log(res)
		if (res.errMsg == 'scanCode:fail') {
			util.showModel('错误', '无法识别的二维码')
		}
      },
      complete: function (res) {

      },
    })
  },

  btn_delete: function(e) {
	productes = productes.filter(function(p, index) {
		return p.checked == false 
	})
	for (var i=0; i < productes.length; i++) {
		productes[i].index = i
	}
	console.log(productes)
	this.setData({
		items: productes
	})
  },

  btn_submit: function(e) {
    if (img_uploading > 0) {
      wx.showModal({
        title: '等待上传完成'
      })
      return;
    }
    if (commited == true) {
      return;
    }
    commited = true


    for (var i=0; i < productes.length; i++) {
        var item = {}
        item.uuid = productes[i].uuid
        item.num =  productes[i].num 
        item.in_price = productes[i].in_price 
        item.title = productes[i].title 
        item.image = productes[i].img_url
		item.sale_price = productes[i].sale_price
        the_list.prds = the_list.prds.concat(item)
    }

    console.log('submit:', the_list)

    wx.request({
      url: config.service.requestDBUrl,
      data: {
        name: 'in',
        info: the_list,
      },
      method: 'POST',
      success: function (res) {
        console.log(res)
        if (res.data.code == 0) {
          util.showSuccess('保存成功')
        } else {
          util.showModel('保存失败', res)
          commited = false
        }
      },
      fail: function (res) {
        util.showModel('保存失败', res)
        commited = false
      }
    })
  }

})
