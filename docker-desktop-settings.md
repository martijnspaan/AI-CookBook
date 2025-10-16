# Docker Desktop Disk Space Management Settings

## 🔧 Manual Configuration Required

Since Docker Desktop doesn't expose disk limits through CLI, you need to configure these settings manually:

### 1. Open Docker Desktop Settings
- Right-click Docker Desktop system tray icon
- Select "Settings" or "Preferences"

### 2. Configure Disk Image Size
**Path:** Settings → Resources → Advanced
- **Disk image size**: Set to **60 GB** (recommended for development)
- This prevents Docker from consuming unlimited disk space

### 3. Enable Automatic Cleanup
**Path:** Settings → Resources → Advanced
- ✅ **Remove unused data**: Enable this option
- This automatically removes unused containers, images, and volumes

### 4. Configure WSL Integration
**Path:** Settings → Resources → WSL Integration
- ✅ **Enable integration with my default WSL distro**
- ✅ **Enable integration with additional distros** (if needed)

### 5. Set Memory and CPU Limits
**Path:** Settings → Resources → Advanced
- **Memory**: 8 GB (adjust based on your system)
- **CPUs**: 4-6 cores (adjust based on your system)

## 📊 Current Docker Usage

Run this command to check current usage:
```powershell
docker system df
```

## 🧹 Manual Cleanup Commands

### Quick Cleanup
```powershell
# Remove all unused containers, networks, images, and build cache
docker system prune -f

# Remove everything including volumes (⚠️ This will delete all volumes!)
docker system prune -f --volumes
```

### Selective Cleanup
```powershell
# Remove unused containers only
docker container prune -f

# Remove unused images only
docker image prune -f

# Remove unused volumes only
docker volume prune -f

# Remove build cache only
docker builder prune -f
```

## 📈 Monitoring Script

Use the provided `docker-disk-management.ps1` script for:
- Automated cleanup
- Scheduled weekly maintenance
- Usage monitoring
- Best practices recommendations

## ⚠️ Important Notes

1. **Backup Important Data**: Before running cleanup commands, ensure you don't need any containers or volumes
2. **Kind Cluster**: Your Kind cluster data is stored in Docker Desktop's internal storage
3. **Shared Data**: Your application data in `E:\Kind\shared-data` is safe from cleanup
4. **Image Sizes**: Use multi-stage builds to keep image sizes small
5. **Regular Maintenance**: Run cleanup commands weekly to prevent disk space issues

## 🎯 Recommended Limits

| Resource | Recommended Limit | Reason |
|----------|------------------|---------|
| Disk Image Size | 60 GB | Prevents unlimited growth |
| Memory | 8 GB | Enough for development |
| CPUs | 4-6 cores | Good performance |
| Auto Cleanup | Enabled | Prevents accumulation |
