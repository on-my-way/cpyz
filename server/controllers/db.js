const { mysql } = require('../qcloud')
//const uuid = require('node-uuid')

module.exports = {

  get: async ctx => {
    /*var id = uuid.v1()
    // 增
    var book = {
      id: id,
      name: "冰与火之歌",
      price: 88
    }
    await mysql("Book").insert(book)
    // 查
    var res = await mysql("Book").where({ id }).first()
    // 改
    await mysql("Book").update({ price: 66 }).where({ id })
    // 删
    await mysql("Book").del().where({ id })
  */
    var res
    var arg = ctx.query
    if (arg.name == 'sale_info') {
      res = await mysql("product").select('image', 'title', 'sale_price').where({'uuid':ctx.query.uuid})
    } else if (arg.name == 'detail_info') {
      res = await mysql("product").select('*').where({ 'uuid': ctx.query.uuid })
    } else if (arg.name == 'vip') {
      res = await mysql('vip').select('count').where({'uuid':ctx.query.uuid})
    }
    /*var data = {};
    data.image = 'https://qcloudtest-1256599268.cos.ap-guangzhou.myqcloud.com/1524797808081-HkOu-zgpz.jpg'
    data.title = 'little gril'
    data.scale_price = '100'*/

    ctx.state.data = res
  },

  post: async ctx => {
    var res
    var result
    var arg = ctx.request.body

      console.log(arg)
      if (arg.name == 'in') {
        var recs = []

        for (var i =0; i < arg.info.prds.length; i++) {
          var rec = {}
          rec.date = arg.info.date
          rec.uuid = arg.info.prds[i].uuid  
          rec.num = arg.info.prds[i].num
          recs = recs.concat(rec)
          result = await mysql("product").select('num').where({ 'uuid': rec.uuid })
          if (result.length == 0) {
             res = await mysql('product').insert(arg.info.prds[i])
          } else {
            res = await mysql('product').where('uuid', '=', rec.uuid).update({
              num: parseInt(rec.num) + result[0].num,
              image: arg.info.prds[i].image
            })
          }
        }
        await mysql('in_list').insert(recs)
    
      } else {
        var data = []
        var info = arg.info
        for (var i = 0; i < arg.info.prds.length; i++) {
          var item = {}
          item.date = info.date      
          item.num = info.prds[i].num
          item.price = info.prds[i].price
          item.state = arg.name
          item.uuid = info.prds[i].uuid
          data = data.concat(item)
        }
        res = await mysql('out_prd').insert(data)    

        var d = {}
        d.date = info.date
        d.pay = info.pay
        d.state = arg.name
        res = await mysql('out_list').insert(d)
      }
      
    ctx.state.data = res
  }
}