class FileStack{

    constructor(){
        this.stack=[];
        this.top=-1;
        this.size=0;
    }

    pop() {
        if(this.size<=1){
            return;
        }
        this.size--;
        this.top--;
        return this.stack.pop();
    }

    push(fileID){
        this.stack.push(fileID);
        this.size++;
        this.top++;
    }

    peek(){
        if(this.size>0){
            return this.stack[top];
        }
        else{
            return;
        }
    }
}

module.exports={
    FileStack: FileStack
};