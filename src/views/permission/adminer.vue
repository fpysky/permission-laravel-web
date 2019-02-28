<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button class="filter-item" plain icon="el-icon-plus" @click="add">{{ $t('table.add') }}</el-button>
      <el-input :placeholder="$t('table.title')" v-model="listQuery.title" style="width: 160px;" class="filter-item"
        @keyup.enter.native="handleFilter" />
      <el-date-picker v-model="listQuery.stime" style="width: 160px;" class="filter-item" type="date"
        placeholder="开始日期" />
      <el-date-picker v-model="listQuery.etime" style="width: 160px;" class="filter-item" type="date"
        placeholder="结束日期" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        {{ $t('table.search') }}</el-button>
      <el-button v-waves class="filter-item" plain icon="el-icon-delete" @click="handleClear">
        {{ $t('table.clear') }}</el-button>
    </div>
    <el-table v-loading="listLoading" :data="list" highlight-current-row style="width: 100%;" @sort-change="sortChange">
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="90" />
      <el-table-column label="账号" prop="account" align="center" width="110" />
      <el-table-column label="昵称" prop="nick_name" align="center" width="110" />
      <el-table-column label="头像" prop="avatar" align="center" width="110" />
      <el-table-column label="简介" prop="introduction" align="center" width="110" />
      <el-table-column :label="$t('table.actions')" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">{{ $t('table.edit') }}
          </el-button>
          <!-- <el-button v-if="scope.row.status!='published'" size="mini" type="success"
                        @click="handleModifyStatus(scope.row,'published')">{{ $t('table.publish') }}
                    </el-button>
                    <el-button v-if="scope.row.status!='draft'" size="mini"
                        @click="handleModifyStatus(scope.row,'draft')">{{ $t('table.draft') }}
                    </el-button>
                    <el-button v-if="scope.row.status!='deleted'" size="mini" type="danger"
                        @click="handleModifyStatus(scope.row,'deleted')">{{ $t('table.delete') }}
                    </el-button> -->
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit"
      @pagination="getList" />
    <Modal v-model="addModal" width="400">
      <p slot="header" style="text-align:center"><span>添加管理员</span></p>
      <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="70px">
        <el-form-item :class="submitErrors.account?'is-error':''" label="账号：" prop="account">
          <el-input @input="inputChange('account')" v-model="ruleForm.account" placeholder="账号" />
          <div v-if="submitErrors.account" class="el-form-item__error">{{ submitErrors.account[0] }}</div>
        </el-form-item>
        <el-form-item :class="submitErrors.password?'is-error':''" label="密码：" prop="password">
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
          <el-checkbox-group @input="inputChange('roles')" v-loading="rolesLoading" v-model="ruleForm.roles">
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
  import { fetchList, adminers, getAllRole } from '@/api/adminer'
  import Pagination from '@/components/Pagination'
  import { getToken } from '@/utils/auth'
  export default {
    name: 'AdminerPermission',
    directives: { waves },
    components: { Pagination },
    data() {
      return {
        listQuery: {
          title: '',
          stime: '',
          etime: '',
          page: 1,
          limit: 20
        },
        listLoading: true,
        list: [],
        total: 0,
        keyword: '',
        addModal: false,
        ruleForm: {
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
      }
    },
    created() {
      this.getList()
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
      handleFilter() {
        this.listQuery.page = 1
        this.getList()
      },
      getList() {
        fetchList({
          page: this.page,
          keyword: this.keyword
        }).then(res => {
          this.listLoading = false
          this.list = res.data.list
          this.total = res.data.total
        }).catch(err => {
          this.listLoading = false
          this.$message.error('服务器或网络错误')
        })
      },
      handleClear() {

      },
      sortChange(data) {
        const { prop, order } = data
        if (prop === 'id') {
          this.sortByID(order)
        }
      },
      handleUpdate(row) {

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
            adminers(this.ruleForm).then(res => {
              this.submitLoading = false
              if (res.data.code == 0) {
                this.$message.success('操作成功')
                this.addModal = false
                this.getList()
              } else if (res.data.code == 422) {
                this.oldRuleForm = JSON.parse(JSON.stringify(this.ruleForm))
                this.submitErrors = res.data.err
              } else {
                this.$message.warning(res.data.msg)
              }
            }).catch(err => {
              console.log(err,'err')
              this.submitLoading = false
              this.$message.error('服务器或网络错误')
            })
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
  .el-form-item.is-error .el-input__inner{
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