module.exports = async (tokenObj) => {
  // tokenObj为原始token信息结构如下
  // {
  //   uid: 'abc', // 用户id
  //   role: [], // 用户角色列表
  //   permission: [] // 用户权限列表，admin角色的用户权限列表为空数组
  // }
  tokenObj.customField = {
  } // 自定义token字段
  return tokenObj // 注意务必返回修改后的token对象
}
