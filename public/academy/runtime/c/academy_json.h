/* Native C17 JSON utilities for portable Academy exercises.
 * cJSON 1.7.19 (MIT) and SQLite 3.53.4 (public domain) are linked separately.
 * Values created by these helpers belong to the per-case arena. Containers
 * copy inserted values, so they never share ownership of a cJSON child.
 * academy_clear() releases every arena root after the result is serialized.
 */
#ifndef GRAALY_ACADEMY_JSON_H
#define GRAALY_ACADEMY_JSON_H
#include <cJSON.h>
#include <sqlite3.h>
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <math.h>
#include <ctype.h>
#include <regex.h>
typedef cJSON J;
typedef struct academy_allocation { J *value; struct academy_allocation *next; } academy_allocation;
static academy_allocation *academy_pool;
static void academy_error(const char *message) { fprintf(stderr, "%s\n", message); exit(3); }
static J *j_track(J *value) {
    if (!value) academy_error("JSON allocation failed");
    academy_allocation *entry = malloc(sizeof *entry);
    if (!entry) academy_error("JSON arena allocation failed");
    entry->value=value; entry->next=academy_pool; academy_pool=entry; return value;
}
static void academy_clear(void) {
    while (academy_pool) { academy_allocation *next=academy_pool->next; cJSON_Delete(academy_pool->value); free(academy_pool); academy_pool=next; }
}
static J *j_null(void) { return j_track(cJSON_CreateNull()); }
static J *j_num(double value) { if(!isfinite(value))academy_error("Non-finite result");return j_track(cJSON_CreateNumber(value)); }
static J *j_bool(int value) { return j_track(cJSON_CreateBool(value!=0)); }
static J *j_str(const char *value) { return j_track(cJSON_CreateString(value?value:"")); }
static double j_number(const J *value) { return cJSON_IsNumber(value)?value->valuedouble:cJSON_IsTrue(value)?1:cJSON_IsString(value)?strtod(value->valuestring,NULL):0; }
static const char *j_string(const J *value) { return cJSON_IsString(value)?value->valuestring:""; }
static size_t j_utf8_width(unsigned char byte) { return byte<0x80?1:(byte&0xe0)==0xc0?2:(byte&0xf0)==0xe0?3:(byte&0xf8)==0xf0?4:1; }
static size_t j_length(const J *value) {
    if(cJSON_IsString(value)){size_t count=0;const unsigned char *text=(unsigned char*)value->valuestring;while(*text){size_t width=j_utf8_width(*text);for(size_t i=1;i<width;i++)if(!text[i]){width=i;break;}text+=width;count++;}return count;}
    return cJSON_IsArray(value)||cJSON_IsObject(value)?(size_t)cJSON_GetArraySize(value):0;
}
static int j_truth(const J *value) { return value&&!cJSON_IsNull(value)&&!cJSON_IsFalse(value)&&(cJSON_IsNumber(value)?value->valuedouble!=0:cJSON_IsString(value)||cJSON_IsArray(value)||cJSON_IsObject(value)?j_length(value)>0:1); }
static J *j_clone(J *value) { return value?j_track(cJSON_Duplicate(value,1)):j_null(); }
static J *j_at(J *value,size_t index) {
    if(cJSON_IsString(value)){const char *text=value->valuestring;size_t i=0;while(*text&&i<index){text+=j_utf8_width((unsigned char)*text);i++;}if(!*text)return j_null();size_t width=j_utf8_width((unsigned char)*text);char part[5]={0};memcpy(part,text,width);return j_str(part);}
    J *item=cJSON_IsArray(value)?cJSON_GetArrayItem(value,(int)index):NULL;return item?item:j_null();
}
static J *j_str_value(J *value) {
    if(cJSON_IsString(value))return j_clone(value);
    if(cJSON_IsNull(value))return j_str("None");
    if(cJSON_IsBool(value))return j_str(cJSON_IsTrue(value)?"True":"False");
    char *text=cJSON_PrintUnformatted(value);J *result=j_str(text);free(text);return result;
}
static J *j_get(J *value,J *key,J *fallback) {
    J *item=NULL;
    if((cJSON_IsArray(value)||cJSON_IsString(value))&&cJSON_IsString(key)&&!strcmp(j_string(key),"length"))return j_num(j_length(value));
    if(cJSON_IsObject(value)){J *text=j_str_value(key);item=cJSON_GetObjectItemCaseSensitive(value,j_string(text));}
    else if((cJSON_IsArray(value)||cJSON_IsString(value))&&cJSON_IsNumber(key)){long long index=(long long)j_number(key),count=(long long)j_length(value);if(index<0)index+=count;if(index>=0&&index<count)item=j_at(value,(size_t)index);}
    return item?item:(fallback?fallback:j_null());
}
static J *j_array(int count,...) { J *result=j_track(cJSON_CreateArray());va_list args;va_start(args,count);for(int i=0;i<count;i++){J *value=va_arg(args,J*);if(!cJSON_AddItemToArray(result,value?cJSON_Duplicate(value,1):cJSON_CreateNull()))academy_error("Array allocation failed");}va_end(args);return result; }
static J *j_object(int count,...) { J *result=j_track(cJSON_CreateObject());va_list args;va_start(args,count);for(int i=0;i<count;i++){J *key=va_arg(args,J*),*value=va_arg(args,J*);J *text=j_str_value(key);if(!cJSON_AddItemToObject(result,j_string(text),value?cJSON_Duplicate(value,1):cJSON_CreateNull()))academy_error("Object allocation failed");}va_end(args);return result; }
static J *j_set(J *value,J *key,J *item) {
    J *copy=item?cJSON_Duplicate(item,1):cJSON_CreateNull();if(!copy)academy_error("Copy allocation failed");
    if(cJSON_IsArray(value)){long long index=(long long)j_number(key),count=(long long)j_length(value);if(index<0)index+=count;if(index<0||index>=count){cJSON_Delete(copy);academy_error("Array index outside bounds");}cJSON_ReplaceItemInArray(value,(int)index,copy);}
    else if(cJSON_IsObject(value)){J *text=j_str_value(key);if((cJSON_GetObjectItemCaseSensitive(value,j_string(text))!=NULL))cJSON_ReplaceItemInObjectCaseSensitive(value,j_string(text),copy);else cJSON_AddItemToObject(value,j_string(text),copy);}
    else {cJSON_Delete(copy);academy_error("set expects an array or object");}return j_null();
}
static J *j_append(J *value,J *item) { if(!cJSON_IsArray(value))academy_error("append expects an array");cJSON_AddItemToArray(value,item?cJSON_Duplicate(item,1):cJSON_CreateNull());return j_null(); }
static J *j_pop(J *value,J *key) { long long index=(long long)j_number(key),count=(long long)j_length(value);if(index<0)index+=count;if(index<0||index>=count)return j_null();J *result=j_clone(cJSON_GetArrayItem(value,(int)index));cJSON_DeleteItemFromArray(value,(int)index);return result; }
static J *j_delete_key(J *value,J *key) { cJSON_DeleteItemFromObjectCaseSensitive(value,j_string(j_str_value(key)));return j_null(); }
static J *j_keys(J *value) { J *result=j_array(0);if(cJSON_IsObject(value))for(J *item=value->child;item;item=item->next)j_append(result,j_str(item->string));return result; }
static int j_equal(J *a,J *b) { return (!a||cJSON_IsNull(a))&&(!b||cJSON_IsNull(b))?1:a&&b?cJSON_Compare(a,b,1):0; }
static int j_compare(J *a,J *b) {
    if(j_equal(a,b))return 0;if(cJSON_IsNumber(a)&&cJSON_IsNumber(b))return j_number(a)<j_number(b)?-1:1;
    if(cJSON_IsString(a)&&cJSON_IsString(b))return strcmp(j_string(a),j_string(b));
    if(cJSON_IsArray(a)&&cJSON_IsArray(b)){size_t n=j_length(a)<j_length(b)?j_length(a):j_length(b);for(size_t i=0;i<n;i++){int cmp=j_compare(j_at(a,i),j_at(b,i));if(cmp)return cmp;}return j_length(a)<j_length(b)?-1:1;}
    return j_number(a)<j_number(b)?-1:1;
}
static J *j_eq(J *a,J *b){return j_bool(j_equal(a,b));}static J *j_ne(J *a,J *b){return j_bool(!j_equal(a,b));}
static J *j_lt(J *a,J *b){return j_bool(j_compare(a,b)<0);}static J *j_le(J *a,J *b){return j_bool(j_compare(a,b)<=0);}static J *j_gt(J *a,J *b){return j_bool(j_compare(a,b)>0);}static J *j_ge(J *a,J *b){return j_bool(j_compare(a,b)>=0);}
static J *j_in(J *a,J *b) { if(cJSON_IsString(b))return j_bool(strstr(j_string(b),j_string(a))!=NULL);if(cJSON_IsObject(b))return j_bool((cJSON_GetObjectItemCaseSensitive(b,j_string(j_str_value(a)))!=NULL));if(cJSON_IsArray(b))for(J *item=b->child;item;item=item->next)if(j_equal(item,a))return j_bool(1);return j_bool(0); }
static J *j_not_in(J *a,J *b) { return j_bool(!j_truth(j_in(a,b))); }
static J *j_remove(J *a,J *b) { for(size_t i=0;i<j_length(a);i++)if(j_equal(j_at(a,i),b)){cJSON_DeleteItemFromArray(a,(int)i);break;}return j_null(); }
static J *j_len(J *value){return j_num((double)j_length(value));}
static J *j_add(J *a,J *b) { if(cJSON_IsString(a)&&cJSON_IsString(b)){size_t x=strlen(j_string(a)),y=strlen(j_string(b));char *text=malloc(x+y+1);if(!text)academy_error("String allocation failed");memcpy(text,j_string(a),x);memcpy(text+x,j_string(b),y+1);J *result=j_str(text);free(text);return result;}if(cJSON_IsArray(a)&&cJSON_IsArray(b)){J *result=j_clone(a);for(J *item=b->child;item;item=item->next)j_append(result,item);return result;}return j_num(j_number(a)+j_number(b)); }
static J *j_sub(J*a,J*b){return j_num(j_number(a)-j_number(b));}static J *j_mul(J*a,J*b){return j_num(j_number(a)*j_number(b));}
static J *j_div(J*a,J*b){if(j_number(b)==0)academy_error("Division by zero");return j_num(j_number(a)/j_number(b));}static J *j_idiv(J*a,J*b){return j_num(floor(j_number(j_div(a,b))));}
static J *j_mod(J*a,J*b){double divisor=j_number(b);if(!divisor)academy_error("Modulo by zero");double value=fmod(j_number(a),divisor);if(value&&((value<0)!=(divisor<0)))value+=divisor;return j_num(value);}
static J *j_pow(J*a,J*b){return j_num(pow(j_number(a),j_number(b)));}static J *j_neg(J*a){return j_num(-j_number(a));}static J *j_not(J*a){return j_bool(!j_truth(a));}
static J *j_band(J*a,J*b){return j_num((double)((int64_t)j_number(a)&(int64_t)j_number(b)));}static J *j_bor(J*a,J*b){return j_num((double)((int64_t)j_number(a)|(int64_t)j_number(b)));}static J *j_bxor(J*a,J*b){return j_num((double)((int64_t)j_number(a)^(int64_t)j_number(b)));}
static J *j_shl(J*a,J*b){double shift=j_number(b);if(shift<0||shift>=64)academy_error("Shift outside 0..63");return j_num((double)((uint64_t)j_number(a)<<(unsigned)shift));}static J *j_shr(J*a,J*b){double shift=j_number(b);if(shift<0||shift>=64)academy_error("Shift outside 0..63");return j_num((double)((int64_t)j_number(a)>>(unsigned)shift));}static J *j_invert(J*a){return j_num((double)~(int64_t)j_number(a));}
static J *j_min(J*a,J*b){return j_compare(a,b)<=0?a:b;}static J *j_max(J*a,J*b){return j_compare(a,b)>=0?a:b;}static J *j_abs(J*a){return j_num(fabs(j_number(a)));}static J *j_floor(J*a){return j_num(floor(j_number(a)));}static J *j_ceil(J*a){return j_num(ceil(j_number(a)));}
static J *j_float(J*a){return j_num(j_number(a));}static J *j_int(J*a){return j_num(cJSON_IsString(a)?(double)strtoll(j_string(a),NULL,10):trunc(j_number(a)));}static J *j_bool_value(J*a){return j_bool(j_truth(a));}static J *j_str_convert(J*a){return j_str_value(a);}
static J *j_round(J*a,J*b){double factor=pow(10,j_number(b));return j_num(nearbyint(j_number(a)*factor)/factor);}
static J *j_is_number(J*a){return j_bool(cJSON_IsNumber(a));}static J *j_is_integer(J*a){return j_bool(cJSON_IsNumber(a)&&trunc(j_number(a))==j_number(a));}static J *j_is_string(J*a){return j_bool(cJSON_IsString(a));}
static J *j_is_list(J*a){return j_bool(cJSON_IsArray(a));}static J *j_is_object(J*a){return j_bool(cJSON_IsObject(a));}
static J *j_byte_length(J*a){return j_num(strlen(j_string(a)));}
static J *j_decode_query(const char *text,size_t length){char *out=malloc(length+1);if(!out)academy_error("Query allocation failed");size_t at=0;for(size_t i=0;i<length;i++){if(text[i]=='%'&&i+2<length&&isxdigit((unsigned char)text[i+1])&&isxdigit((unsigned char)text[i+2])){char hex[3]={text[i+1],text[i+2],0};out[at++]=(char)strtoul(hex,NULL,16);i+=2;}else out[at++]=text[i]=='+'?' ':text[i];}out[at]=0;J *result=j_str(out);free(out);return result;}
static J *j_query_params(J *url){const char *text=strchr(j_string(url),'?');J *result=j_object(0);if(!text)return result;text++;while(*text&&*text!='#'){const char *end=text;while(*end&&*end!='&'&&*end!='#')end++;const char *equals=memchr(text,'=',(size_t)(end-text));if(end>text){J *key=j_decode_query(text,equals?(size_t)(equals-text):(size_t)(end-text));J *value=equals?j_decode_query(equals+1,(size_t)(end-equals-1)):j_str("");j_set(result,key,value);}if(*end!='&')break;text=end+1;}return result;}
static J *j_url_path(J *url){const char *text=j_string(url),*scheme=strstr(text,"://");if(scheme){text=strchr(scheme+3,'/');if(!text)return j_str("/");}size_t n=strcspn(text,"?#");if(!n)return j_str("/");char *path=malloc(n+1);if(!path)academy_error("URL allocation failed");memcpy(path,text,n);path[n]=0;J *result=j_str(path);free(path);return result;}
static uint64_t j_word(J *value){return cJSON_IsString(value)?strtoull(j_string(value),NULL,0):(uint64_t)j_number(value);}
static J *j_bits_count(J *value){uint64_t word=j_word(value);unsigned count=0;while(word){word&=word-1;count++;}return j_num(count);}
static J *j_bits_op(J *operation,J *a,J *b){uint64_t left=j_word(a),right=j_word(b),result=!strcmp(j_string(operation),"or")?left|right:!strcmp(j_string(operation),"and")?left&right:left&~right;char text[32];snprintf(text,sizeof text,"0x%llx",(unsigned long long)result);return j_str(text);}
static J *j_bits_shift(J *value,J *shift){unsigned count=(unsigned)j_number(shift);return j_num(count>=64?0:(double)(j_word(value)<<count));}
static J *j_bits_extract(J *value,J *offset,J *width){unsigned start=(unsigned)j_number(offset),count=(unsigned)j_number(width);if(!count||start>=64||count>64-start)return j_num(0);uint64_t mask=count==64?UINT64_MAX:(UINT64_C(1)<<count)-1;return j_num((double)((j_word(value)>>start)&mask));}
static J *j_rotate32(J *value,J *count){uint32_t word=(uint32_t)j_word(value);unsigned shift=(unsigned)j_number(count)%32;return j_num(shift?(word<<shift)|(word>>(32-shift)):word);}
static J *j_float_bits(J *value){float number=cJSON_IsString(value)?strtof(j_string(value),NULL):(float)j_number(value);uint32_t word;memcpy(&word,&number,sizeof word);return j_num(word);}
typedef struct {J *fields;int frozen;} academy_record;
static int academy_record_set(academy_record *record,J *key,J *value){if(record->frozen)return 0;j_set(record->fields,key,value);return 1;}
static J *j_frozen_probe(J *data,J *defaults,J *field,J *value,J *list_field){academy_record first={j_clone(defaults),1},second={j_clone(defaults),1};for(J *item=data?data->child:NULL;item;item=item->next){j_set(first.fields,j_str(item->string),item);j_set(second.fields,j_str(item->string),item);}J *expected=j_clone(j_get(second.fields,list_field,j_null()));int frozen=!academy_record_set(&first,field,value);j_append(j_get(first.fields,list_field,j_null()),j_str("probe"));return j_object(2,j_str("frozen"),j_bool(frozen),j_str("independent_defaults"),j_bool(j_equal(expected,j_get(second.fields,list_field,j_null()))));}
static J *j_uri_component(J*a){const char *text=cJSON_IsBool(a)?cJSON_IsTrue(a)?"true":"false":j_string(j_str_value(a));size_t length=strlen(text);char *out=malloc(length*3+1);if(!out)academy_error("URI allocation failed");size_t at=0;const char *hex="0123456789ABCDEF";for(size_t i=0;i<length;i++){unsigned char byte=(unsigned char)text[i];if(isalnum(byte)||strchr("-_.!~*'()",byte)){out[at++]=(char)byte;}else{out[at++]='%';out[at++]=hex[byte>>4];out[at++]=hex[byte&15];}}out[at]=0;J *result=j_str(out);free(out);return result;}
static J *j_range(J *a,J *b,J *c){double start=j_number(a),end=j_number(b),step=c&&!cJSON_IsNull(c)?j_number(c):1;if(!b||cJSON_IsNull(b)){end=start;start=0;}if(step==0)academy_error("range step must be nonzero");J *result=j_array(0);for(double x=start;step>0?x<end:x>end;x+=step){if(j_length(result)>1000000)academy_error("range exceeds resource limit");j_append(result,j_num(x));}return result;}
static J *j_slice(J *value,J *a,J *b,J *c){long long count=(long long)j_length(value),step=(long long)j_number(c);if(!step)academy_error("Slice step must be nonzero");long long start=cJSON_IsNull(a)?(step>0?0:count-1):(long long)j_number(a),end=cJSON_IsNull(b)?(step>0?count:-1):(long long)j_number(b);if(!cJSON_IsNull(a)&&start<0)start+=count;if(!cJSON_IsNull(b)&&end<0)end+=count;if(start<0)start=step>0?0:-1;if(start>count)start=count;if(end<0)end=step>0?0:-1;if(end>count)end=count;J *result=cJSON_IsString(value)?j_str(""):j_array(0);for(long long i=start;step>0?i<end:i>end;i+=step){if(i<0||i>=count)continue;J *item=j_at(value,(size_t)i);if(cJSON_IsString(value))result=j_add(result,item);else j_append(result,item);}return result;}
static J *j_list(J *value){if(cJSON_IsArray(value))return j_clone(value);if(cJSON_IsObject(value))return j_keys(value);J *result=j_array(0);if(cJSON_IsString(value))for(size_t i=0;i<j_length(value);i++)j_append(result,j_at(value,i));return result;}
static J *j_reversed(J *value){return j_slice(j_list(value),j_null(),j_null(),j_num(-1));}
static J *j_sum(J *value){double result=0;for(J *item=value?value->child:NULL;item;item=item->next)result+=j_number(item);return j_num(result);}
static J *j_unique(J *value){J *result=j_array(0);for(J *item=value?value->child:NULL;item;item=item->next)if(!j_truth(j_in(item,result)))j_append(result,item);return result;}
static J *j_sort_fields(J *value,J *fields){J *result=j_clone(value);for(size_t p=j_length(fields);p>0;p--){J *field=j_at(fields,p-1);const char *raw=j_string(field),*suffix=strchr(raw,':');char *name=malloc((suffix?(size_t)(suffix-raw):strlen(raw))+1);if(!name)academy_error("Sort allocation failed");size_t count=suffix?(size_t)(suffix-raw):strlen(raw);memcpy(name,raw,count);name[count]=0;J *key=isdigit((unsigned char)name[0])?j_num(strtod(name,NULL)):j_str(name);int direction=suffix&&!strcmp(suffix+1,"desc")?-1:1;for(size_t i=1;i<j_length(result);i++){size_t pos=i;while(pos>0&&j_compare(j_get(j_at(result,pos-1),key,j_null()),j_get(j_at(result,pos),key,j_null()))*direction>0){J *left=j_clone(j_at(result,pos-1)),*right=j_clone(j_at(result,pos));j_set(result,j_num(pos-1),right);j_set(result,j_num(pos),left);pos--;}}free(name);}if(!j_length(fields))for(size_t i=1;i<j_length(result);i++){size_t pos=i;while(pos>0&&j_compare(j_at(result,pos-1),j_at(result,pos))>0){J *left=j_clone(j_at(result,pos-1)),*right=j_clone(j_at(result,pos));j_set(result,j_num(pos-1),right);j_set(result,j_num(pos),left);pos--;}}return result;}
static J *j_strip(J *value){const char *s=j_string(value);size_t start=0,end=strlen(s);while(start<end&&isspace((unsigned char)s[start]))start++;while(end>start&&isspace((unsigned char)s[end-1]))end--;char *text=malloc(end-start+1);if(!text)academy_error("String allocation failed");memcpy(text,s+start,end-start);text[end-start]=0;J *result=j_str(text);free(text);return result;}
static J *j_lower(J *value){J *result=j_clone(value);for(char *p=result->valuestring;p&&*p;p++)*p=(char)tolower((unsigned char)*p);return result;}static J *j_upper(J *value){J *result=j_clone(value);for(char *p=result->valuestring;p&&*p;p++)*p=(char)toupper((unsigned char)*p);return result;}
static J *j_startswith(J*a,J*b){return j_bool(!strncmp(j_string(a),j_string(b),strlen(j_string(b))));}static J *j_endswith(J*a,J*b){size_t x=strlen(j_string(a)),y=strlen(j_string(b));return j_bool(x>=y&&!strcmp(j_string(a)+x-y,j_string(b)));}
static J *j_split(J *value,J *separator){const char *text=j_string(value),*sep=j_string(separator);size_t width=strlen(sep);J *result=j_array(0);if(!separator||cJSON_IsNull(separator)){while(*text){while(*text&&isspace((unsigned char)*text))text++;if(!*text)break;const char *end=text;while(*end&&!isspace((unsigned char)*end))end++;size_t n=(size_t)(end-text);char *part=malloc(n+1);if(!part)academy_error("Split allocation failed");memcpy(part,text,n);part[n]=0;j_append(result,j_str(part));free(part);text=end;}return result;}if(!width)academy_error("Empty separator");while(1){const char *end=strstr(text,sep);size_t n=end?(size_t)(end-text):strlen(text);char *part=malloc(n+1);if(!part)academy_error("Split allocation failed");memcpy(part,text,n);part[n]=0;j_append(result,j_str(part));free(part);if(!end)break;text=end+width;}return result;}
static J *j_join(J *separator,J *values){J *result=j_str("");for(size_t i=0;i<j_length(values);i++){if(i)result=j_add(result,separator);result=j_add(result,j_at(values,i));}return result;}
static J *j_replace(J*a,J*b,J*c){return j_join(c,j_split(a,b));}
static J *j_index(J *value,J *item){if(cJSON_IsString(value)){const char *pos=strstr(j_string(value),j_string(item));return j_num(pos?(double)(pos-j_string(value)):-1);}for(size_t i=0;i<j_length(value);i++)if(j_equal(j_at(value,i),item))return j_num(i);return j_num(-1);}
static J *j_regex(J *pattern,J *value){regex_t compiled;int code=regcomp(&compiled,j_string(pattern),REG_EXTENDED);if(code)academy_error("Invalid regular expression");int matches=regexec(&compiled,j_string(value),0,NULL,0)==0;regfree(&compiled);return j_bool(matches);}
static J *j_json_text(J *value){char *text=cJSON_PrintUnformatted(value);if(!text)academy_error("JSON serialization failed");J *result=j_str(text);free(text);return result;}
static J *j_json_parse(J *value){J *result=cJSON_Parse(j_string(value));if(!result)academy_error("Invalid JSON");return j_track(result);}
static J *j_decimal_total(J *items){int64_t total=0;for(J *item=items?items->child:NULL;item;item=item->next){const char *price=j_string(j_get(item,j_str("price"),j_null()));int negative=*price=='-';if(negative)price++;char *end;int64_t cents=strtoll(price,&end,10)*100;if(*end=='.'){end++;if(isdigit((unsigned char)end[0]))cents+=(end[0]-'0')*10;if(end[0]&&isdigit((unsigned char)end[1]))cents+=end[1]-'0';}total+=(negative?-cents:cents)*(int64_t)j_number(j_get(item,j_str("quantity"),j_num(0)));}char text[80];uint64_t value=total<0?(uint64_t)(-(total+1))+1:(uint64_t)total;snprintf(text,sizeof text,"%s%llu.%02llu",total<0?"-":"",(unsigned long long)(value/100),(unsigned long long)(value%100));return j_str(text);}
/* Gregorian conversion avoids platform local time and preserves ISO offsets. */
static J *j_epoch(J *value){int y,m,d,h=0,minute=0;double second=0;const char *text=j_string(value);if(sscanf(text,"%d-%d-%dT%d:%d:%lf",&y,&m,&d,&h,&minute,&second)<3)academy_error("Invalid ISO datetime");int adjusted=y-(m<=2),era=(adjusted>=0?adjusted:adjusted-399)/400;unsigned year=(unsigned)(adjusted-era*400),day=(153*(m+(m>2?-3:9))+2)/5+d-1,days=year*365+year/4-year/100+day;double result=((double)era*146097+days-719468)*86400+h*3600+minute*60+second;const char *tz=strchr(text+10,'+');if(!tz)tz=strchr(text+10,'-');if(tz){int oh=0,om=0;sscanf(tz+1,"%d:%d",&oh,&om);result-=(*tz=='+'?1:-1)*(oh*3600+om*60);}return j_num(result);}
static J *j_select_paths(J *value,J *paths){J *result=j_object(0);for(size_t i=0;i<j_length(paths);i++){J *path=j_at(paths,i),*parts=j_split(path,j_str(".")),*current=value;size_t offset=0;while(offset<j_length(parts)){size_t count=cJSON_IsObject(current)?j_length(parts)-offset:1;J *key=j_join(j_str("."),j_slice(parts,j_num(offset),j_num(offset+count),j_num(1)));while(count>1&&!cJSON_GetObjectItemCaseSensitive(current,j_string(key))){count--;key=j_join(j_str("."),j_slice(parts,j_num(offset),j_num(offset+count),j_num(1)));}if(cJSON_IsArray(current)&&strspn(j_string(key),"0123456789")==strlen(j_string(key))&&strlen(j_string(key)))key=j_int(key);current=j_get(current,key,j_null());offset+=count;}j_set(result,path,current);}return result;}
static J *j_sql_rows(J *fixture,J *schema,J *query){sqlite3 *db=NULL;if(sqlite3_open(":memory:",&db)!=SQLITE_OK)academy_error("SQLite open failed");const char *setup=j_string(j_get(fixture,j_str("setup"),j_str("")));if(sqlite3_exec(db,"PRAGMA foreign_keys=ON;",NULL,NULL,NULL)!=SQLITE_OK||sqlite3_exec(db,j_string(schema),NULL,NULL,NULL)!=SQLITE_OK||sqlite3_exec(db,setup,NULL,NULL,NULL)!=SQLITE_OK)academy_error(sqlite3_errmsg(db));J *rows=j_array(0);const char *tail=j_string(query);while(*tail){sqlite3_stmt *statement=NULL;const char *next=NULL;if(sqlite3_prepare_v2(db,tail,-1,&statement,&next)!=SQLITE_OK)academy_error(sqlite3_errmsg(db));tail=next;if(!statement)continue;J *params=j_get(fixture,j_str("params"),j_object(0));for(int p=1;p<=sqlite3_bind_parameter_count(statement);p++){const char *name=sqlite3_bind_parameter_name(statement,p);J *v=j_get(params,j_str(name?name+1:""),j_null());if(cJSON_IsNumber(v))sqlite3_bind_double(statement,p,j_number(v));else if(cJSON_IsString(v))sqlite3_bind_text(statement,p,j_string(v),-1,SQLITE_TRANSIENT);else if(cJSON_IsBool(v))sqlite3_bind_int(statement,p,cJSON_IsTrue(v));else sqlite3_bind_null(statement,p);}int columns=sqlite3_column_count(statement);J *current=j_array(0);int status;while((status=sqlite3_step(statement))==SQLITE_ROW){J *row=j_object(0);for(int c=0;c<columns;c++){J *v=sqlite3_column_type(statement,c)==SQLITE_NULL?j_null():sqlite3_column_type(statement,c)==SQLITE_TEXT?j_str((const char*)sqlite3_column_text(statement,c)):j_num(sqlite3_column_double(statement,c));j_set(row,j_str(sqlite3_column_name(statement,c)),v);}j_append(current,row);}if(status!=SQLITE_DONE)academy_error(sqlite3_errmsg(db));if(columns)rows=current;sqlite3_finalize(statement);}J *inspect=j_get(fixture,j_str("inspect"),j_null());if(j_truth(inspect)){sqlite3_stmt *statement=NULL;if(sqlite3_prepare_v2(db,j_string(inspect),-1,&statement,NULL)!=SQLITE_OK)academy_error(sqlite3_errmsg(db));rows=j_array(0);while(sqlite3_step(statement)==SQLITE_ROW){J *row=j_object(0);for(int c=0;c<sqlite3_column_count(statement);c++)j_set(row,j_str(sqlite3_column_name(statement,c)),sqlite3_column_type(statement,c)==SQLITE_NULL?j_null():sqlite3_column_type(statement,c)==SQLITE_TEXT?j_str((const char*)sqlite3_column_text(statement,c)):j_num(sqlite3_column_double(statement,c)));j_append(rows,row);}sqlite3_finalize(statement);}sqlite3_close(db);return rows;}
#endif
