
// ===== Supabase 数据同步 =====
const SUPABASE_URL = 'https://luavduedmnhdpqyftdgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1YXZkdWVkbW5oZHBxeWZ0ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDIzNDcsImV4cCI6MjA5Nzg3ODM0N30._-qKCQk79UhvMyq6byYHon3aPBhrKKC0w480hxEzlao';

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 从 Supabase 加载数据
async function loadFromSupabase() {
    try {
        showToast('正在从云端加载数据...', '');
        
        // 从 wms_data 表读取所有数据
        const { data, error } = await supabase
            .from('wms_data')
            .select('*');
        
        if (error) throw error;
        
        // 解析数据并存入 localStorage
        if (data && data.length > 0) {
            data.forEach(function(row) {
                if (row.data_type === 'products') {
                    localStorage.setItem('wms_p', JSON.stringify(row.data));
                } else if (row.data_type === 'inventory') {
                    localStorage.setItem('wms_i', JSON.stringify(row.data));
                } else if (row.data_type === 'locations') {
                    localStorage.setItem('wms_loc', JSON.stringify(row.data));
                } else if (row.data_type === 'inbound_records') {
                    localStorage.setItem('wms_in_recs', JSON.stringify(row.data));
                }
            });
            
            showToast('云端数据加载成功！', 'success');
            
            // 刷新页面显示
            setTimeout(function() {
                location.reload();
            }, 1000);
        } else {
            showToast('云端暂无数据，将使用本地数据', '');
        }
    } catch (error) {
        console.error('加载云端数据失败:', error);
        showToast('加载云端数据失败: ' + error.message, 'error');
    }
}

// 保存数据到 Supabase
async function saveToSupabase(dataType, data) {
    try {
        // 检查是否已存在
        const { data: existing, error: selError } = await supabase
            .from('wms_data')
            .select('id')
            .eq('data_type', dataType)
            .single();
        
        if (existing) {
            // 更新
            const { error } = await supabase
                .from('wms_data')
                .update({ data: data, updated_at: new Date() })
                .eq('data_type', dataType);
            
            if (error) throw error;
        } else {
            // 插入
            const { error } = await supabase
                .from('wms_data')
                .insert([{ data_type: dataType, data: data }]);
            
            if (error) throw error;
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        throw error;
    }
}

// 同步所有数据到云端
async function syncAllToCloud() {
    showToast('正在同步到云端...', '');
    
    try {
        // 保存商品
        const products = JSON.parse(localStorage.getItem('wms_p') || '[]');
        await saveToSupabase('products', products);
        
        // 保存库存
        const inventory = JSON.parse(localStorage.getItem('wms_i') || '[]');
        await saveToSupabase('inventory', inventory);
        
        // 保存货位
        const locations = JSON.parse(localStorage.getItem('wms_loc') || '{}');
        await saveToSupabase('locations', locations);
        
        // 保存入库记录
        const records = JSON.parse(localStorage.getItem('wms_in_recs') || '[]');
        await saveToSupabase('inbound_records', records);
        
        showToast('所有数据已同步到云端！', 'success');
    } catch (error) {
        showToast('同步失败: ' + error.message, 'error');
    }
}

// 页面加载时自动同步
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载，确保其他组件先初始化
    setTimeout(function() {
        // 检查是否已经有本地数据
        const hasLocalData = localStorage.getItem('wms_p') && 
                            JSON.parse(localStorage.getItem('wms_p')).length > 0;
        
        if (!hasLocalData) {
            // 没有本地数据，从云端加载
            loadFromSupabase();
        }
    }, 2000);
});

// 点击头部触发设置
var _hdrClicks = 0;
var _hdrTimer = null;

function onHeaderClick(){
    _hdrClicks++;
    clearTimeout(_hdrTimer);
    _hdrTimer = setTimeout(function(){
        if(_hdrClicks >= 7){ askResetPassword(); }
        else if(_hdrClicks >= 3){ 
            document.getElementById('cloud-modal').style.display = 'flex'; 
        }
        _hdrClicks = 0;
    }, 3000);
}

function askResetPassword(){
    var pwd = prompt("请输入初始化密码：");
    if(pwd !== "Zw190806"){
        if(pwd !== null) showToast("密码错误，操作已取消", "error");
        return;
    }
    if(!confirm("确定要清除所有数据吗？\n\n将清除：商品、入库记录、货位目录等所有本地数据！\n\n此操作不可恢复！")) return;
    localStorage.removeItem("wms_p");
    localStorage.removeItem("wms_i");
    localStorage.removeItem("wms_l");
    localStorage.removeItem("wms_loc");
    localStorage.removeItem("wms_in_recs");
    showToast("数据已清除，页面将刷新", "success");
    setTimeout(function(){ location.reload(); }, 1000);
}
