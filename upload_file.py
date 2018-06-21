import json
import requests
import xlrd
from datetime import date,datetime


def post_to_db(date, prds):
    url = "https://kc95ihcf.qcloud.la/weapp/db"
    headers = {'Content-Type': 'application/json'}
    d = json.dumps({
        'name':'in',
        'info': {
            'date': date,
            'prds': prds,
            }
        })

    r = requests.post(url, headers=headers, data=d)
    res = json.loads(r.text)
    print(res)
    if res['code'] == 0:
        return True
    else:
        return False

def get_merged_cell(row, merge):
    print(row, merge)
    for index in merge:
        if row >= index[0] and row < index[1]:
            return (True,index[0])
    return (False,0)

#ctype： 0 empty,1 string, 2 number, 3 date, 4 boolean, 5 error

def read_xls_file():
     xls_file = xlrd.open_workbook(r'./aa.xls', formatting_info=True)
     sheet1 = xls_file.sheet_by_index(0)

     nrows = sheet1.nrows
     nclos = sheet1.ncols
     head = sheet1.row_values(0)
     prds = []
     prd_date = ''
     merge = []

     head = ['date', 'title', 'in_price', 'num', 'sale_price', 'uuid']


     uuid = 5

     for (rlow,right,clow,chight) in sheet1.merged_cells:
         merge.append([rlow, right])

     for r in range(1, nrows):
         row = sheet1.row_values(r)
         if row:
             d = {}
             if row[uuid] == '':
                 continue

             if sheet1.cell(r,0).ctype == 3:
                 if prd_date != '':
                     print(prd_date, prds)
                     if post_to_db(prd_date, prds) == False:
                         return False
                     prds.clear()

                 date_value = xlrd.xldate_as_tuple(row[0], xls_file.datemode)
                 prd_date = date(*date_value[:3]).strftime('%Y-%m-%d')

                 for c in range(1,len(head)):
                     if sheet1.cell(r,c).ctype == 2 and row[c] % 1 == 0:
                         if c == uuid:
                            d[head[c]] = str(int(row[c]))
                         elif row[c] == '':
                            d[head[c]] = 0 
                         else:
                            d[head[c]] = int(row[c])
                     else:
                        d[head[c]] = row[c]

                 d['image'] = ''

                 prds.append(d)
             else:
                 (ret, merge_row) = get_merged_cell(r, merge) 
                 if ret == True:
                     #date_value = xlrd.xldate_as_tuple(sheet1.cell_value(merge_row, 0), xls_file.datemode)
                     #d[head[0]] = date(*date_value[:3]).strftime('%Y-%m-%d')
                     for c in range(1,len(head)):
                        if sheet1.cell(r,c).ctype == 2 and row[c] % 1 == 0:
                            if c == uuid:
                                d[head[c]] = str(int(row[c]))
                            elif row[c] == '':
                                d[head[c]] = 0 
                            else:
                                d[head[c]] = int(row[c])
                        else:
                            d[head[c]] = row[c]

                     d['image'] = ''
                     prds.append(d)
     #post_to_db(data)
     return True







if __name__ == '__main__':
    ret = read_xls_file()
    if ret == True:
        print("上传成功") 
    else: 
        print("上传失败, 请检查数据是否有误") 



