<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button class="filter-item" plain icon="el-icon-plus" @click="add">{{ $t('table.add') }}</el-button>
      <el-input :placeholder="$t('table.title')" v-model="query.keyword" style="width: 160px;" class="filter-item"
        @keyup.enter.native="getData" />
      <el-date-picker v-model="query.stime" style="width: 160px;" class="filter-item" type="date" placeholder="开始日期" />
      <el-date-picker v-model="query.etime" style="width: 160px;" class="filter-item" type="date" placeholder="结束日期" />
      <el-button v-waves class="filter-item" type="primary" :loading="tableLoading" icon="el-icon-search"
        @click="getData">
        {{ $t('table.search') }}</el-button>
      <el-button v-waves class="filter-item" plain icon="el-icon-delete" @click="clear">
        {{ $t('table.clear') }}</el-button>
    </div>

    <el-table v-loading="tableLoading" :data="list" highlight-current-row style="width: 100%;"
      @sort-change="sortChange">
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="90" />
      <el-table-column label="账号" prop="account" align="center" width="200" />
      <el-table-column label="昵称" prop="nick_name" align="center" width="200" />
      <el-table-column label="头像" prop="avatar" align="center" width="200">
        <template slot-scope="scope">
          <img style="width:50px;height:50px;" :src="scope.row.avatar" alt="" />
        </template>
      </el-table-column>
      <el-table-column label="简介" prop="introduction" align="center" />
      <el-table-column :label="$t('table.actions')" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="edit(scope.row)">{{ $t('table.edit') }}
          </el-button>
          <el-popover placement="top" width="160" v-model="scope.row.deletePopover">
            <p style="text-align:center;padding:3px 0;"><i class="el-icon-warning"></i> 确定要删除吗？</p>
            <div style="text-align: right; margin: 0">
              <el-button size="mini" @click="scope.row.deletePopover = false">取消</el-button>
              <el-button type="danger" size="mini" @click="deleteAdminer(scope.$index)">确定</el-button>
            </div>
            <el-button slot="reference" size="mini" type="danger">{{ $t('table.delete') }}
            </el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="query.page" :limit.sync="query.limit"
      @pagination="getData" />
    <Modal v-model="addModal" width="400">
      <p slot="header" style="text-align:center"><span>添加管理员</span></p>
      <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="70px">
        <el-form-item :class="submitErrors.account?'is-error':''" label="账号：" prop="account">
          <el-input @input="inputChange('account')" v-model="ruleForm.account" placeholder="账号" />
          <div v-if="submitErrors.account" class="el-form-item__error">{{ submitErrors.account[0] }}</div>
        </el-form-item>
        <el-form-item v-if="!isEdit" :class="submitErrors.password?'is-error':''" label="密码：" prop="password">
          <el-input @input="inputChange('password')" v-model="ruleForm.password" type="password" placeholder="密码" />
          <div v-if="submitErrors.password" class="el-form-item__error">{{ submitErrors.password[0] }}</div>
        </el-form-item>
        <el-form-item :class="submitErrors.nick_name?'is-error':''" label="昵称：" prop="nick_name">
          <el-input @input="inputChange('nick_name')" v-model="ruleForm.nick_name" placeholder="昵称" />
          <div v-if="submitErrors.nick_name" class="el-form-item__error">{{ submitErrors.nick_name[0] }}</div>
        </el-form-item>
        <el-form-item label="头像：" prop="avatar">
          <el-upload :action="uploadHeadImageUrl" :data="{dir:'adminerHead'}" :headers="uploadHeadImageHeaders"
            :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload"
            class="avatar-uploader">
            <img v-if="ruleForm.avatar" :src="ruleForm.avatar" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
        <el-form-item label="简介：" prop="introduction">
          <el-input :autosize="{ minRows: 2, maxRows: 4}" v-model="ruleForm.introduction" type="textarea"
            placeholder="简介" />
        </el-form-item>
        <el-form-item :class="submitErrors.roles?'is-error':''" label="角色：" prop="roles">
          <el-checkbox-group v-loading="rolesLoading" v-model="ruleForm.roles">
            <el-checkbox v-for="(role,index) in roles" :label="role.id" name="type">{{ role.name }}
            </el-checkbox>
            <div v-if="submitErrors.roles" class="el-form-item__error">{{ submitErrors.roles[0] }}</div>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button :loading="submitLoading" style="width:76%;" type="primary" @click="submitForm">
          {{ submitLoading ? '提交中': '提交' }}</el-button>
        <el-button @click="resetForm('ruleForm')" icon="el-icon-refresh">重置</el-button>
      </div>
    </Modal>
  </div>
</template>
<script>
  import waves from '@/directive/waves'
  import { fetchList, adminers, getAllRole, getAdminerRoles, deleteAdminer, updateAdminer } from '@/api/adminer'
  import Pagination from '@/components/Pagination'
  import { getToken } from '@/utils/auth'
  export default {
    name: 'AdminerPermission',
    directives: { waves },
    components: { Pagination },
    data() {
      return {
        deletePopover: false,
        query: {
          keyword: '',
          stime: '',
          etime: '',
          page: 1,
          limit: 20
        },
        tableLoading: false,
        list: [],
        total: 0,
        keyword: '',
        addModal: false,
        ruleForm: {
          id: 0,
          account: '',
          nick_name: '',
          introduction: '',
          avatar: '',
          roles: [],
          password: ''
        },
        oldRuleForm: {},
        rules: {
          account: [
            { required: true, message: '请输入账户名', trigger: 'blur' },
          ],
          nick_name: [
            { required: true, message: '请输入昵称', trigger: 'blur' },
          ],
          password: [
            { required: true, message: '请输入密码', trigger: 'blur' },
          ],
          roles: [
            { type: 'array', required: true, message: '请选择角色', trigger: 'change' },
          ],
        },
        uploadHeadImageUrl: '/api/uploadHeadImage',
        uploadHeadImageHeaders: { 'Authorization': 'Bearer ' + getToken() },
        roles: [],
        rolesLoading: false,
        submitLoading: false,
        submitErrors: {},
        isEdit: false,
      }
    },
    created() {
      this.getData()
    },
    methods: {
      resetForm() {
        this.submitErrors = {}
        this.$refs['ruleForm'].resetFields();
      },
      inputChange(val) {
        if (this.submitErrors[val] && this.ruleForm[val] != this.oldRuleForm[val]) delete this.submitErrors[val]
      },
      getAllRole() {
        this.rolesLoading = true
        getAllRole().then(res => {
          this.rolesLoading = false
          if (res.data.code == 0) {
            this.roles = res.data.list
          } else {
            this.$message.warning(res.data.msg)
          }
        }).catch(err => {
          this.rolesLoading = false
          this.$message.error('服务器或网络错误')
        })
      },
      add() {
        this.addModal = true
        this.getAllRole()
        this.submitErrors = {}
        this.$refs['ruleForm'].resetFields()
      },
      getData() {
        this.tableLoading = true
        fetchList(this.query).then(res => {
          this.tableLoading = false
          this.list = res.data.list
          this.list.forEach(item => { item.deletePopover = false })
          this.total = res.data.total
        }).catch(err => {
          this.tableLoading = false
          this.$message.error('服务器或网络错误')
        })
      },
      clear() {
        this.query.keyword = ''
        this.query.stime = ''
        this.query.etime = ''
        this.query.page = 1
      },
      deleteAdminer(k) {
        deleteAdminer(this.list[k].id).then(res => {
          if (res.data.code == 0) {
            this.$message.success('操作成功')
            this.getData()
            this.list[k].deletePopover = false
          } else {
            this.$message.warning(res.data.msg)
          }
        }).catch(err => {
          this.$message.warning('服务器或网络错误')
        })
      },
      sortChange(data) {
        const { prop, order } = data
        if (prop === 'id') {
          this.sortByID(order)
        }
      },
      edit(row) {
        this.isEdit = true
        this.addModal = true
        this.getAllRole()
        delete row.created_at
        delete row.updated_at
        this.ruleForm.id = row.id
        this.ruleForm.account = row.account
        this.ruleForm.nick_name = row.nick_name
        this.ruleForm.introduction = row.introduction
        this.ruleForm.avatar = row.avatar
        this.getAdminerRoles(row.id)
      },
      getAdminerRoles(id) {
        getAdminerRoles(id).then(res => {
          if (res.data.code == 0) {
            this.ruleForm.roles = res.data.list
          } else {
            this.$message.warning(res.data.msg)
          }
        }).catch(err => {
          this.$message.warning('服务器或网络错误')
        })
      },
      handleAvatarSuccess(res, file) {
        this.ruleForm.avatar = res.path
      },
      beforeAvatarUpload(file) {
        const isJPG = file.type === 'image/jpeg'
        const isLt2M = file.size / 1024 / 1024 < 2

        if (!isJPG) {
          this.$message.error('上传头像图片只能是 JPG 格式!')
        }
        if (!isLt2M) {
          this.$message.error('上传头像图片大小不能超过 2MB!')
        }
        return isJPG && isLt2M
      },
      submitForm() {
        this.$refs['ruleForm'].validate((valid) => {
          if (valid) {
            this.submitLoading = true
            if (this.ruleForm.id == 0) {
              adminers(this.ruleForm).then(res => {
                this.submitLoading = false
                if (res.data.code == 0) {
                  this.$message.success('操作成功')
                  this.addModal = false
                  this.getData()
                } else if (res.data.code == 422) {
                  this.oldRuleForm = JSON.parse(JSON.stringify(this.ruleForm))
                  this.submitErrors = res.data.err
                } else {
                  this.$message.warning(res.data.msg)
                }
              }).catch(err => {
                console.log(err, 'err')
                this.submitLoading = false
                this.$message.error('服务器或网络错误')
              })
            } else {
              updateAdminer(this.ruleForm).then(res => {
                this.submitLoading = false
                if (res.data.code == 0) {
                  this.$message.success('操作成功')
                  this.addModal = false
                  this.getData()
                } else if (res.data.code == 422) {
                  this.oldRuleForm = JSON.parse(JSON.stringify(this.ruleForm))
                  this.submitErrors = res.data.err
                } else {
                  this.$message.warning(res.data.msg)
                }
              }).catch(err => {
                console.log(err, 'err')
                this.submitLoading = false
                this.$message.error('服务器或网络错误')
              })
            }

          } else {
            console.log('error submit!!')
            return false
          }
        })
      }
    }
  }
</script>
<style>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    line-height: 100px;
    text-align: center;
  }

  .avatar {
    width: 100px;
    height: 100px;
    display: block;
  }

  .el-form-item.is-error .el-input__inner {
    border-color: #f56c6c !important;
  }
</style>
<style scoped>
  .el-checkbox {
    margin-left: 12px;
    width: 130px;
    overflow: hidden;
  }

  .el-checkbox:first-child {
    margin-left: 12px;
  }
</style>