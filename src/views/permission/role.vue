<template>
    <div class="app-container">
        <div class="filter-container">
            <el-button class="filter-item" plain icon="el-icon-plus" @click="add">{{ $t('table.add') }}</el-button>
            <el-input placeholder="搜索点什么" v-model="query.keyword" style="width: 160px;" class="filter-item"
                @keyup.enter.native="getData" />
            <el-date-picker v-model="query.stime" style="width: 160px;" class="filter-item" value-format="yyyy-MM-dd"
                type="date" placeholder="开始日期" />
            <el-date-picker v-model="query.etime" style="width: 160px;" class="filter-item" value-format="yyyy-MM-dd"
                type="date" placeholder="结束日期" />
            <el-button v-waves class="filter-item" type="primary" :loading="tableLoading" icon="el-icon-search"
                @click="getData">
                {{ $t('table.search') }}</el-button>
            <el-button v-waves class="filter-item" plain icon="el-icon-delete" @click="clear">
                {{ $t('table.clear') }}</el-button>
        </div>

        <el-table v-loading="tableLoading" :data="list" highlight-current-row style="width: 100%;"
            @sort-change="sortChange" @row-dblclick="edit">
            <el-table-column label="ID" prop="id" sortable="custom" align="center" width="90" />
            <el-table-column label="角色名称" prop="name" align="center" width="200" />
            <el-table-column label="简介" prop="desc" align="center" />
            <el-table-column label="创建时间" prop="created_at" align="center" />
            <el-table-column label="更新时间" prop="updated_at" align="center" />
            <el-table-column :label="$t('table.actions')" align="center" width="230"
                class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button type="primary" size="mini" @click="edit(scope.row)">{{ $t('table.edit') }}
                    </el-button>
                    <el-popover placement="top" width="160" v-model="scope.row.deletePopover">
                        <p style="text-align:center;padding:3px 0;"><i class="el-icon-warning"></i> 确定要删除吗？</p>
                        <div style="text-align: right; margin: 0">
                            <el-button type="danger" size="mini" @click="deleteFunc(scope.$index)">确定</el-button>
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
            <p slot="header" style="text-align:center"><span>添加角色</span></p>
            <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="100px">
                <el-form-item :class="submitErrors.name?'is-error':''" label="角色名称：" prop="name">
                    <el-input @input="inputChange('name')" v-model="ruleForm.name" placeholder="角色名称" />
                    <div v-if="submitErrors.name" class="el-form-item__error">{{ submitErrors.name[0] }}</div>
                </el-form-item>
                <el-form-item label="描述：" prop="desc">
                    <el-input :autosize="{ minRows: 2, maxRows: 4}" v-model="ruleForm.desc" type="textarea"
                        placeholder="简介" />
                </el-form-item>
                <el-form-item :class="submitErrors.permissions?'is-error':''" label="权限：" prop="permissions">
                    <template v-for="(permission,index) in permissions">
                        <el-checkbox v-model="permission.checked" :indeterminate="permission.isIndeterminate" @change="((val)=>{handleCheckAllChange(val, index)})" :label="permission.id">{{ permission.name }}</el-checkbox>
                        <div style="margin: 15px 0;"></div>
                        <el-checkbox-group style="padding:0 0 0 20px;border:1px solid #cccccc;border-radius: 3px;" v-loading="permissionsLoading" v-model="ruleForm.permissions" @change="((val)=>{handleCheckedChildrenChange(val, index)}) ">
                            <el-checkbox v-for="(permissionChildren,childIndex) in permission.children" :label="permissionChildren.id" name="type">{{ permissionChildren.name }}
                            </el-checkbox>
                            <div v-if="submitErrors.permissions" class="el-form-item__error">{{ submitErrors.permissions[0] }}</div>
                        </el-checkbox-group>
                    </template>
                    <!-- <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
                    <div style="margin: 15px 0;"></div>
                    <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
                        <el-checkbox v-for="city in cities" :label="city" :key="city">{{city}}</el-checkbox>
                    </el-checkbox-group>
                    <el-checkbox-group v-loading="permissionsLoading" v-model="ruleForm.permissions">
                      <el-checkbox v-for="(permission,index) in permissions" :label="permission.id" name="type">{{ permission.name }}
                      </el-checkbox>
                      <div v-if="submitErrors.permissions" class="el-form-item__error">{{ submitErrors.permissions[0] }}</div>
                    </el-checkbox-group> -->
                  </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button :loading="submitLoading" style="width:76%;" type="primary" @click="submitForm">
                    {{ submitLoading ? '提交中': '提交' }}</el-button>
                <el-button @click="resetData" icon="el-icon-refresh">重置</el-button>
            </div>
        </Modal>
    </div>
</template>
<script>
    import waves from '@/directive/waves'
    import { fetchList, deleteRole, getAllPermission, roles } from '@/api/role'
    import Pagination from '@/components/Pagination'
    export default {
        name: 'RolePermission',
        directives: { waves },
        components: { Pagination },
        data() {
            return {
                tableLoading: false,
                query: {
                    keyword: '',
                    stime: '',
                    etime: '',
                    page: 1,
                    limit: 20,
                    sort: [],
                },
                addModal: false,
                isEdit: false,
                ruleForm: {
                    id: 0,
                    name: '',
                    desc: '',
                    permissions: [],
                },
                rules: {
                    name: [
                        { required: true, message: '请输入角色名', trigger: 'blur' },
                    ],
                    permissions: [
                        { type: 'array', required: true, message: '请选择权限', trigger: 'change' },
                    ],
                },
                submitErrors: {},
                list: [],
                total: 0,
                permissionsLoading: false,
                submitLoading: false,
                permissions:[],
            }
        },
        created() {
            this.getData()
        },
        methods: {
            handleCheckAllChange(val,index) {
                if(val){
                    if(this.ruleForm.permissions.indexOf(this.permissions[index].id) === -1) this.ruleForm.permissions.push(this.permissions[index].id)
                    this.permissions[index].children.forEach(item => {
                        if(this.ruleForm.permissions.indexOf(item.id) === -1) this.ruleForm.permissions.push(item.id)
                    })
                }else{
                    let pIndex = this.ruleForm.permissions.indexOf(this.permissions[index].id)
                    if(pIndex !== -1){
                        this.ruleForm.permissions.splice(pIndex, 1)
                    }
                    this.permissions[index].children.forEach(item => {
                        let cIndex = this.ruleForm.permissions.indexOf(item.id)
                        this.ruleForm.permissions.splice(cIndex,1)
                    })
                }
                this.permissions[index].isIndeterminate = false
            },
            handleCheckedChildrenChange(val,index){
                this.$forceUpdate()
                this.ruleForm.permissions = val
                
                if(val.length == 0){
                    this.permissions[index].isIndeterminate = false
                }else{
                    let isIndeterminate = false
                    this.permissions[index].children.forEach(item => {
                        if(val.indexOf(item.id) !== -1){
                            isIndeterminate = true
                            
                        }
                    })
                    if(isIndeterminate){
                        if(this.ruleForm.permissions.indexOf(this.permissions[index].id) === -1){
                            this.ruleForm.permissions.push(this.permissions[index].id)
                        }
                    }else{
                        this.ruleForm.permissions.splice(this.ruleForm.permissions.indexOf(this.permissions[index].id),1)
                        this.permissions[index].checked = false
                    }
                    this.permissions[index].isIndeterminate = isIndeterminate
                }
            },
            inputChange(val) {
                if (this.submitErrors[val] && this.ruleForm[val] != this.oldRuleForm[val]) delete this.submitErrors[val]
            },
            resetData() {
                this.ruleForm.id = 0
                this.$refs['ruleForm'].resetFields()
                this.submitErrors = {}
            },
            add() {
                this.addModal = true
                this.isEdit = false
                this.resetData()
                this.getAllPermission()
            },
            getAllPermission(){
                this.permissionsLoading = true
                getAllPermission().then(res => {
                    this.permissionsLoading = false
                    if (res.data.code == 0) {
                        this.permissions = res.data.list
                        this.permissions.forEach(item => {
                            item.checked = false
                            item.isIndeterminate = false
                        })
                    } else {
                        this.$message.warning(res.data.msg)
                    }
                }).catch(err => {
                    this.permissionsLoading = false
                    this.$message.error('服务器或网络错误')
                })
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
            },
            edit(row) {
                this.resetData()
                // this.getAdminerRoles(row.id)
                // this.getAllRole()
                this.isEdit = true
                this.addModal = true
                // this.ruleForm.id = row.id
                // this.ruleForm.account = row.account
                // this.ruleForm.nick_name = row.nick_name
                // this.ruleForm.introduction = row.introduction
                // this.ruleForm.avatar = row.avatar
            },
            deleteFunc(k) {
                deleteRole(this.list[k].id).then(res => {
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
                let order = ''
                if (data.order === 'ascending') {
                    order = 'asc'
                } else {
                    order = 'desc'
                }
                if (this.query.sort.length) {
                    this.query.sort.forEach(item => {
                        if (item.field == data.prop) {
                            if (item.order != order) {
                                item.order = order
                            }
                        } else {
                            this.query.sort.push({ field: data.prop, order: order })
                        }
                    })
                } else {
                    this.query.sort.push({ field: data.prop, order: order })
                }
                this.getData()
            },
            submitForm() {
                this.$refs['ruleForm'].validate((valid) => {
                    if (valid) {
                        console.log(this.ruleForm,'this.ruleForm')
                        return
                        this.submitLoading = true
                        if (this.ruleForm.id == 0) {
                            roles(this.ruleForm).then(res => {
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
                                this.submitLoading = false
                                this.$message.error('服务器或网络错误')
                            })
                        } else {
                            updateRole(this.ruleForm).then(res => {
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
                                this.submitLoading = false
                                this.$message.error('服务器或网络错误')
                            })
                        }

                    } else {
                        console.log('error submit!!')
                        return false
                    }
                })
            },
        },
    }
</script>
<style>
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