Page({
  data: {
    primarySize: 'default',
    loading: false,
    plain: false,
    disable: false,
  },
  
  button_in: function(event) {
    wx.navigateTo({
        url: './in',
    })
  },

  button_out: function (event) {
    wx.navigateTo({
      url: './out',
    })
  },

})