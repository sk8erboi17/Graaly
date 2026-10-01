/* SQLite's documented VFS interface, restricted to private :memory: databases.
 * No filesystem or network access is exposed to browser exercises.
 * SQLITE_TEMP_STORE=3 keeps temporary query storage in memory as well.
 */
#include <sqlite3.h>
#include <string.h>
#include <stdint.h>
static int academy_open(sqlite3_vfs *vfs,const char *name,sqlite3_file *file,int flags,int *out){(void)vfs;(void)name;(void)file;(void)flags;(void)out;return SQLITE_CANTOPEN;}
static int academy_delete(sqlite3_vfs *vfs,const char *name,int sync){(void)vfs;(void)name;(void)sync;return SQLITE_IOERR_DELETE;}
static int academy_access(sqlite3_vfs *vfs,const char *name,int flags,int *out){(void)vfs;(void)name;(void)flags;*out=0;return SQLITE_OK;}
static int academy_path(sqlite3_vfs *vfs,const char *name,int capacity,char *out){(void)vfs;size_t length=strlen(name);if(length>=(size_t)capacity)return SQLITE_CANTOPEN;memcpy(out,name,length+1);return SQLITE_OK;}
static int academy_random(sqlite3_vfs *vfs,int count,char *out){(void)vfs;uint32_t state=0x19c07841;for(int i=0;i<count;i++){state^=state<<13;state^=state>>17;state^=state<<5;out[i]=(char)state;}return count;}
static int academy_sleep(sqlite3_vfs *vfs,int microseconds){(void)vfs;(void)microseconds;return 0;}
static int academy_time(sqlite3_vfs *vfs,double *out){(void)vfs;*out=2440587.5;return SQLITE_OK;}
static int academy_last_error(sqlite3_vfs *vfs,int capacity,char *out){(void)vfs;if(capacity>0)out[0]=0;return 0;}
static sqlite3_vfs academy_vfs={
    .iVersion=1,.szOsFile=sizeof(sqlite3_file),.mxPathname=512,.zName="academy-memory",
    .xOpen=academy_open,.xDelete=academy_delete,.xAccess=academy_access,.xFullPathname=academy_path,
    .xRandomness=academy_random,.xSleep=academy_sleep,.xCurrentTime=academy_time,.xGetLastError=academy_last_error
};
int sqlite3_os_init(void){return sqlite3_vfs_register(&academy_vfs,1);}
int sqlite3_os_end(void){return SQLITE_OK;}
